#ifdef USE_ESP32

#include "imgx_ble_requester.h"
#include "esphome/core/hal.h"   // millis()
#include "esphome/core/log.h"

#include <cstring>
#include <esp_heap_caps.h>
#include <esp_gattc_api.h>         // esp_ble_gattc_write_char / register_for_notify
#include <esp_gatt_common_api.h>   // esp_ble_gatt_set_local_mtu

namespace esphome::imgx_ble_requester {

static const char *const TAG = "imgx_ble_requester";

// IMGX message types (protocol/imgx.py:33-34). The REQUESTER (central) SENDS
// REQ/HELLO_ACK/NAK/DONE_ACK and RECEIVES HELLO/DATA/DONE — the mirror of the camera.
enum {
  M_HELLO = 1, M_HELLO_ACK = 2, M_DATA = 3, M_ACK = 4,
  M_NAK = 5, M_DONE = 6, M_DONE_ACK = 7, M_REQ = 0x10,
};

// --- CRC helpers, byte-compatible with protocol/imgx.py (verbatim from UART requester) ---
// CRC-16/CCITT-FALSE: init 0xFFFF, poly 0x1021, MSB-first, no reflection. Chainable.
static uint16_t crc16_ccitt(uint16_t crc, const uint8_t *d, size_t n) {
  for (size_t i = 0; i < n; i++) {
    crc ^= (uint16_t) d[i] << 8;
    for (int k = 0; k < 8; k++)
      crc = (crc & 0x8000) ? (uint16_t) ((crc << 1) ^ 0x1021) : (uint16_t) (crc << 1);
  }
  return crc;
}
// CRC-32 (zlib / ISO-HDLC): reflected, poly 0xEDB88320, init+xorout 0xFFFFFFFF.
static uint32_t crc32_zlib(const uint8_t *d, size_t n) {
  uint32_t crc = 0xFFFFFFFFu;
  for (size_t i = 0; i < n; i++) {
    crc ^= d[i];
    for (int k = 0; k < 8; k++)
      crc = (crc & 1u) ? (crc >> 1) ^ 0xEDB88320u : (crc >> 1);
  }
  return crc ^ 0xFFFFFFFFu;
}

static inline void be16(uint8_t *p, uint16_t v) {
  p[0] = (uint8_t) (v >> 8);
  p[1] = (uint8_t) v;
}
static inline void be32(uint8_t *p, uint32_t v) {
  p[0] = (uint8_t) (v >> 24);
  p[1] = (uint8_t) (v >> 16);
  p[2] = (uint8_t) (v >> 8);
  p[3] = (uint8_t) v;
}
static inline uint32_t rd32(const uint8_t *p) {
  return ((uint32_t) p[0] << 24) | ((uint32_t) p[1] << 16) | ((uint32_t) p[2] << 8) | (uint32_t) p[3];
}

void ImgxBleRequester::setup() {
  // Preallocate the reassembly buffer in PSRAM (no per-transfer heap churn).
  this->img_ = (uint8_t *) heap_caps_malloc(IMGX_MAX_IMAGE, MALLOC_CAP_SPIRAM);
  if (this->img_ == nullptr) {
    ESP_LOGE(TAG, "PSRAM alloc failed (%u B)", (unsigned) IMGX_MAX_IMAGE);
    this->mark_failed();
    return;
  }
  // Raise the requested MTU. ESPHome never calls esp_ble_gatt_set_local_mtu itself, so
  // without this the base's auto esp_ble_gattc_send_mtu_req negotiates ~23 (20B frags).
  // Our camera set 517 and macOS negotiated 515; ask for the same. Throughput only.
  esp_err_t mret = esp_ble_gatt_set_local_mtu(IMGX_LOCAL_MTU);
  if (mret != ESP_OK)
    ESP_LOGW(TAG, "esp_ble_gatt_set_local_mtu(%u) -> %d", IMGX_LOCAL_MTU, mret);
  ESP_LOGCONFIG(TAG, "IMGX BLE requester ready (pulls on interval / on demand once connected)");
}

void ImgxBleRequester::dump_config() {
  ESP_LOGCONFIG(TAG,
                "IMGX BLE requester (CENTRAL):\n"
                "  Role: REQUESTER — sends REQ (0x%02X) over the WRITE char, pulls a JPEG\n"
                "  Service UUID : %s\n"
                "  Write   UUID : %s\n"
                "  Notify  UUID : %s\n"
                "  Chunk: %u   Max image: %u B   Transfer timeout: %u ms   Req MTU: %u",
                M_REQ, IMGX_BLE_SVC_UUID, IMGX_BLE_WRITE_UUID, IMGX_BLE_NOTIFY_UUID,
                IMGX_CHUNK, (unsigned) IMGX_MAX_IMAGE, (unsigned) IMGX_TIMEOUT_MS, IMGX_LOCAL_MTU);
  if (this->is_failed())
    ESP_LOGE(TAG, "  Setup Failed");
}

// === TRANSPORT EDGE (TX) ===
// Build the frame IDENTICALLY to the UART requester; only the final write differs:
// instead of write_array() to a UART bus, WRITE the camera's WRITE characteristic,
// write-WITH-response (ESP_GATT_WRITE_TYPE_RSP). Frames the requester sends
// (REQ/HELLO_ACK/NAK/DONE_ACK) carry at most 5 payload bytes.
void ImgxBleRequester::send_frame_(uint8_t mtype, uint16_t seq, const uint8_t *pl, uint16_t pllen) {
  if (!this->ready_()) {
    ESP_LOGW(TAG, "send_frame_ before connection/discovery ready — dropped (type 0x%02X)", mtype);
    return;
  }
  uint8_t buf[9 + 8];  // SYNC(2)+TYPE(1)+SEQ(2)+LEN(2)+PAYLOAD(<=5)+CRC(2)
  buf[0] = 0xA5;
  buf[1] = 0xA5;
  uint8_t *body = buf + 2;  // CRC16 input starts HERE (TYPE), not at SYNC.
  body[0] = mtype;
  be16(body + 1, seq);
  be16(body + 3, pllen);
  if (pllen)
    memcpy(body + 5, pl, pllen);
  uint16_t c = crc16_ccitt(0xFFFF, body, (size_t) 5 + pllen);
  be16(body + 5 + pllen, c);
  // write-WITH-response: the camera's WRITE char is PROPERTY_WRITE; a WRITE_NR would be
  // dropped (protocol/pull_imgx_ble.py uses response=True). Use the CACHED handle —
  // the parent may have freed the BLECharacteristic objects after ESTABLISHED.
  esp_err_t err = esp_ble_gattc_write_char(this->parent()->get_gattc_if(), this->parent()->get_conn_id(),
                                           this->write_handle_, (uint16_t) (9 + pllen), buf,
                                           ESP_GATT_WRITE_TYPE_RSP, ESP_GATT_AUTH_REQ_NONE);
  if (err != ESP_OK)
    ESP_LOGW(TAG, "write_char failed (type 0x%02X, err %d)", mtype, err);
}

void ImgxBleRequester::start_request_() {
  if (this->state_ != ST_IDLE) {
    ESP_LOGD(TAG, "pull ignored — transfer already in progress (state %d)", (int) this->state_);
    return;
  }
  if (this->img_ == nullptr)
    return;
  if (!this->ready_()) {
    ESP_LOGD(TAG, "pull ignored — not connected/subscribed yet");
    return;
  }
  // No UART buffer to flush — the notify path only delivers frames after we subscribe,
  // so a clean parser reset is all that's needed before the fresh HELLO.
  this->reset_parser_();
  this->nak_rounds_ = 0;
  this->state_ = ST_WAIT_HELLO;
  this->last_activity_ = millis();
  this->send_frame_(M_REQ, 0, nullptr, 0);
  ESP_LOGD(TAG, "REQ sent; waiting for HELLO");
}

// === STATE MACHINE — verbatim port from imgx_uart_requester.cpp:122-208 ===
void ImgxBleRequester::handle_frame_(uint8_t mtype, uint16_t seq, const uint8_t *pl, uint16_t pllen,
                                     bool ok) {
  if (this->state_ == ST_WAIT_HELLO) {
    if (!ok || mtype != M_HELLO)
      return;  // wait for the real, CRC-valid HELLO; timeout guards a stuck peer
    if (pllen < 12) {
      ESP_LOGW(TAG, "short HELLO (%u B)", pllen);
      return;
    }
    // ">IHHI" = {total:4, chunk:2, nchunks:2, img_crc32:4} (imgx.py:181)
    uint32_t total = rd32(pl);
    uint16_t chunk = ((uint16_t) pl[4] << 8) | pl[5];
    uint16_t nch = ((uint16_t) pl[6] << 8) | pl[7];
    uint32_t crc = rd32(pl + 8);
    if (total == 0 || total > IMGX_MAX_IMAGE || chunk == 0 || chunk > IMGX_CHUNK ||
        nch == 0 || nch > IMGX_MAX_CHUNKS) {
      ESP_LOGW(TAG, "bad HELLO total=%u chunk=%u nchunks=%u", (unsigned) total, chunk, nch);
      this->abort_();
      return;
    }
    this->img_len_ = total;
    this->rx_chunk_ = chunk;
    this->nchunks_ = nch;
    this->want_crc_ = crc;
    memset(this->received_, 0, this->nchunks_);
    uint8_t ap[2];
    be16(ap, chunk);  // echo the camera's announced chunk (imgx.py:183)
    this->send_frame_(M_HELLO_ACK, 0, ap, 2);
    this->state_ = ST_RECV_DATA;
    this->last_activity_ = millis();
    ESP_LOGD(TAG, "HELLO %uB in %u chunks crc32=%08x", (unsigned) total, nch, (unsigned) crc);
    return;
  }

  if (this->state_ == ST_RECV_DATA) {
    // Bad-CRC frame: DISCARD silently (slot stays empty). A dropped DATA chunk is
    // recovered by the missing-chunk NAK at DONE. NEVER abort here (imgx.py:189-192).
    if (!ok)
      return;

    if (mtype == M_DATA) {
      // SEQ is the chunk index. Validate before writing into PSRAM.
      size_t off = (size_t) seq * this->rx_chunk_;
      if (seq < this->nchunks_ && off + pllen <= IMGX_MAX_IMAGE) {
        memcpy(this->img_ + off, pl, pllen);
        this->received_[seq] = true;
      } else {
        ESP_LOGW(TAG, "DATA seq %u out of range (nchunks=%u)", seq, this->nchunks_);
      }
    } else if (mtype == M_DONE) {
      int miss = -1;
      for (uint16_t i = 0; i < this->nchunks_; i++) {
        if (!this->received_[i]) {
          miss = i;
          break;
        }
      }
      if (miss >= 0) {
        // Bound the NAK loop so a permanently-missing chunk can't ping-pong forever.
        if (++this->nak_rounds_ > (uint16_t) (3 * this->nchunks_ + IMGX_MAX_NAK_ROUNDS_BASE)) {
          ESP_LOGW(TAG, "too many NAK rounds (%u) -> abort", this->nak_rounds_);
          this->abort_();
          return;
        }
        this->send_frame_(M_NAK, (uint16_t) miss, nullptr, 0);  // NAK{first missing}
        ESP_LOGD(TAG, "missing chunk %d -> NAK", miss);
        this->last_activity_ = millis();
        return;  // stay in ST_RECV_DATA
      }
      // Complete: reassembled image is img_[0..img_len_).
      uint32_t rc = crc32_zlib(this->img_, this->img_len_);
      uint8_t status = (rc == this->want_crc_) ? 0 : 1;
      uint8_t dp[5];
      dp[0] = status;
      be32(dp + 1, rc);
      this->send_frame_(M_DONE_ACK, 0, dp, 5);
      ESP_LOGI(TAG, "image %uB crc32=%08x %s", (unsigned) this->img_len_, (unsigned) rc,
               status ? "MISMATCH" : "CRC OK");
      if (status == 0)
        this->image_callback_.call(this->img_, this->img_len_);  // hand bytes to the display
      this->abort_();
    }
    // M_ACK / others while receiving: ignore.
    return;
  }
  // ST_IDLE: no input expected; ignore.
}

void ImgxBleRequester::abort_() {
  this->state_ = ST_IDLE;
  this->reset_parser_();
}

// === Incremental IMGX frame parser — verbatim from imgx_uart_requester.cpp:219-270 ===
// Byte-identical to the camera's parse_byte_ EXCEPT the plen_ desync cap is
// IMGX_PARSER_PL_MAX(=512) so a full DATA payload is accepted, not dropped.
void ImgxBleRequester::parse_byte_(uint8_t b) {
  switch (this->pstate_) {
    case P_SYNC1:
      if (b == 0xA5)
        this->pstate_ = P_SYNC2;
      break;
    case P_SYNC2:
      if (b == 0xA5) {
        this->pstate_ = P_HDR;
        this->hlen_ = 0;
      } else {
        this->pstate_ = P_SYNC1;
      }
      break;
    case P_HDR:
      this->hdr_[this->hlen_++] = b;
      if (this->hlen_ == 5) {
        this->mtype_ = this->hdr_[0];
        this->rseq_ = ((uint16_t) this->hdr_[1] << 8) | this->hdr_[2];
        this->plen_ = ((uint16_t) this->hdr_[3] << 8) | this->hdr_[4];
        this->pgot_ = 0;
        this->cgot_ = 0;
        if (this->plen_ > IMGX_PARSER_PL_MAX) {
          this->reset_parser_();  // implausible payload len -> treat as desync
          break;
        }
        this->pstate_ = this->plen_ ? P_PAYLOAD : P_CRC;
      }
      break;
    case P_PAYLOAD:
      this->pl_[this->pgot_++] = b;
      if (this->pgot_ == this->plen_) {
        this->pstate_ = P_CRC;
        this->cgot_ = 0;
      }
      break;
    case P_CRC:
      this->crcb_[this->cgot_++] = b;
      if (this->cgot_ == 2) {
        uint16_t rx = ((uint16_t) this->crcb_[0] << 8) | this->crcb_[1];
        uint16_t c = crc16_ccitt(0xFFFF, this->hdr_, 5);
        c = crc16_ccitt(c, this->pl_, this->plen_);
        bool ok = (c == rx);
        uint8_t mt = this->mtype_;
        uint16_t sq = this->rseq_;
        uint16_t pn = this->plen_;
        this->reset_parser_();
        this->handle_frame_(mt, sq, this->pl_, pn, ok);
      }
      break;
  }
}

// === TRANSPORT EDGE (RX + lifecycle) ===
// BLEClient::gattc_event_handler fans EVERY event out to us (ble_client.cpp:51). We
// resolve the char handles at SEARCH_CMPL, subscribe, mark ESTABLISHED once the notify
// registration confirms, then feed notify bytes into the parser. Mirrors ble_sensor.cpp.
void ImgxBleRequester::gattc_event_handler(esp_gattc_cb_event_t event, esp_gatt_if_t /*gattc_if*/,
                                           esp_ble_gattc_cb_param_t *param) {
  switch (event) {
    case ESP_GATTC_OPEN_EVT:
      // Fresh connection: drop any half-transfer and invalidate stale handles until the
      // upcoming service discovery re-resolves them.
      this->abort_();
      this->write_handle_ = 0;
      this->notify_handle_ = 0;
      break;

    case ESP_GATTC_SEARCH_CMPL_EVT: {
      // Discovery done — resolve BOTH chars by UUID and CACHE their handles NOW, before
      // node_state flips to ESTABLISHED (which lets the parent free the char objects).
      auto *wc = this->parent()->get_characteristic(this->svc_uuid_, this->write_uuid_);
      auto *nc = this->parent()->get_characteristic(this->svc_uuid_, this->notify_uuid_);
      if (wc == nullptr || nc == nullptr) {
        ESP_LOGW(TAG, "IMGX chars not found on %s (write=%p notify=%p)", this->parent()->address_str(),
                 (void *) wc, (void *) nc);
        break;
      }
      this->write_handle_ = wc->handle;
      this->notify_handle_ = nc->handle;
      // Subscribe. The base auto-writes the 0x2902 CCCD in ESP_GATTC_REG_FOR_NOTIFY_EVT
      // (ble_client_base.cpp:499-537) — do NOT hand-write it here.
      esp_err_t st = esp_ble_gattc_register_for_notify(this->parent()->get_gattc_if(),
                                                       this->parent()->get_remote_bda(), nc->handle);
      if (st != ESP_OK)
        ESP_LOGW(TAG, "register_for_notify failed, status=%d", st);
      ESP_LOGD(TAG, "resolved write=0x%04x notify=0x%04x, subscribing", this->write_handle_,
               this->notify_handle_);
      break;
    }

    case ESP_GATTC_REG_FOR_NOTIFY_EVT:
      // Subscribe confirmed. ONLY now mark ESTABLISHED (frees the parent svc cache — our
      // handles are already cached) and fire the first REQ. Sending REQ before the
      // subscribe is confirmed loses the HELLO/DATA stream: the camera streams only after
      // REQ and only to a subscribed central (protocol/pull_imgx_ble.py: notify then REQ).
      if (param->reg_for_notify.status == ESP_GATT_OK &&
          param->reg_for_notify.handle == this->notify_handle_) {
        this->node_state = espbt::ClientState::ESTABLISHED;
        ESP_LOGD(TAG, "notify subscribed -> ESTABLISHED; pulling");
        this->start_request_();
      } else if (param->reg_for_notify.handle == this->notify_handle_) {
        ESP_LOGW(TAG, "register_for_notify failed at handle 0x%04x status=%d",
                 param->reg_for_notify.handle, param->reg_for_notify.status);
      }
      break;

    case ESP_GATTC_NOTIFY_EVT:
      // RX: image/control bytes. Filter by our notify handle (events fan out to ALL nodes).
      if (param->notify.handle != this->notify_handle_ || param->notify.value_len == 0)
        break;
      this->last_activity_ = millis();
      for (uint16_t i = 0; i < param->notify.value_len; i++)
        this->parse_byte_(param->notify.value[i]);  // may transition state (HELLO->recv, DONE->idle)
      break;

    case ESP_GATTC_DISCONNECT_EVT:
    case ESP_GATTC_CLOSE_EVT:
      this->abort_();
      this->write_handle_ = 0;
      this->notify_handle_ = 0;
      break;

    default:
      break;
  }
}

// RX now arrives via ESP_GATTC_NOTIFY_EVT — no UART drain here. Keep ONLY the
// per-transfer deadline (stuck-camera guard). ST_IDLE has no deadline.
void ImgxBleRequester::loop() {
  if (this->state_ != ST_IDLE && millis() - this->last_activity_ > IMGX_TIMEOUT_MS) {
    ESP_LOGW(TAG, "timeout in state %d -> abort", (int) this->state_);
    this->abort_();
  }
}

}  // namespace esphome::imgx_ble_requester

#endif  // USE_ESP32
