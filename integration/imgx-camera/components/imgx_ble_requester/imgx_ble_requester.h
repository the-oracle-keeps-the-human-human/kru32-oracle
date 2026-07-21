#pragma once
#ifdef USE_ESP32

#include <cstdint>
#include <cstddef>
#include <functional>

#include "esphome/core/component.h"
#include "esphome/core/automation.h"  // Trigger<>, Action<>
#include "esphome/core/helpers.h"     // CallbackManager
// BLE CENTRAL (GATT client) node — the mirror of imgx_ble's server. This pulls in
// esp32_ble_tracker (ESPBTUUID), esp32_ble_client (BLEClientBase) and the esp-idf
// gattc/gap headers + esp_gatt_common_api.h (for esp_ble_gatt_set_local_mtu).
#include "esphome/components/ble_client/ble_client.h"

namespace esphome::imgx_ble_requester {

namespace espbt = esphome::esp32_ble_tracker;

// ---------------------------------------------------------------------------
// Fixed 128-bit UUIDs — MUST match OUR camera peripheral (esphome/components/
// imgx_ble/imgx_ble.h:27-29 and protocol/pull_imgx_ble.py).
//   SERVICE : advertised by 'camera' (MAC CC:BA:97:04:20:36)
//   WRITE   : central -> camera. We WRITE REQ/HELLO_ACK/NAK/DONE_ACK here
//             (write-WITH-response).
//   NOTIFY  : camera -> central. We SUBSCRIBE; HELLO/DATA/DONE arrive as notifications.
// ---------------------------------------------------------------------------
static constexpr const char *IMGX_BLE_SVC_UUID = "a5a5f000-b1e5-4d2a-9e00-000000000001";
static constexpr const char *IMGX_BLE_WRITE_UUID = "a5a5f000-b1e5-4d2a-9e00-000000000002";
static constexpr const char *IMGX_BLE_NOTIFY_UUID = "a5a5f000-b1e5-4d2a-9e00-000000000003";

// Worst-case JPEG we buffer/reassemble in PSRAM. Must match the camera's
// IMGX_MAX_IMAGE so a legal HELLO total always fits. PSRAM is 8MB — 256KB is generous.
static constexpr size_t IMGX_MAX_IMAGE = 256 * 1024;
// == protocol/imgx.py DEFAULT_CHUNK. The camera negotiates this in HELLO.
static constexpr uint16_t IMGX_CHUNK = 512;
// Parser payload buffer. UNLIKE the imgx_ble SERVER (which only RECEIVES tiny control
// frames and caps at 64), the REQUESTER RECEIVES DATA frames whose payload is up to
// one chunk (512B). This MUST be >= IMGX_CHUNK or every DATA frame is dropped.
static constexpr size_t IMGX_PARSER_PL_MAX = IMGX_CHUNK;
// One received-flag per chunk slot, for missing-chunk detection -> NAK.
static constexpr uint16_t IMGX_MAX_CHUNKS = IMGX_MAX_IMAGE / IMGX_CHUNK;
// Per-transfer deadline. GENEROUS: the camera must capture a frame before it can send
// HELLO, so HELLO can lag the REQ by seconds. Do NOT use a tight per-frame value here.
static constexpr uint32_t IMGX_TIMEOUT_MS = 8000;
// Bound the DONE->NAK->DONE recovery loop so one permanently-missing chunk can't
// ping-pong forever; abort and let the next poll retry cleanly.
static constexpr uint16_t IMGX_MAX_NAK_ROUNDS_BASE = 8;
// Requested local MTU. Our camera calls esp_ble_gatt_set_local_mtu(517); ESPHome never
// sets it on the central side, so we must. Correctness does NOT depend on it (we
// reassemble a byte stream regardless of fragment size) — it is throughput only.
static constexpr uint16_t IMGX_LOCAL_MTU = 517;

// BLE-central image requester. Attaches as a node under a `ble_client:` (which owns the
// connection to MAC CC:BA:97:04:20:36). The IMGX protocol/CRC/parser/reassembly state
// machine is a straight port of imgx_uart_requester — ONLY the transport edges differ:
//   TX  send_frame_()          -> esp_ble_gattc_write_char() on the WRITE char
//   RX  ESP_GATTC_NOTIFY_EVT   -> parse_byte_()  (no UART loop() drain)
class ImgxBleRequester : public PollingComponent, public ble_client::BLEClientNode {
 public:
  void setup() override;
  void loop() override;  // per-transfer timeout guard only (RX arrives via notify cb)
  void dump_config() override;
  float get_setup_priority() const override { return setup_priority::LATE; }

  // PollingComponent tick (default 5s) -> start a pull if idle AND connected.
  void update() override { this->start_request_(); }
  // On-demand pull (imgx_ble_requester.pull action). No-op if a transfer is running.
  void pull() { this->start_request_(); }

  // BLEClientNode: every gattc event for the parent client is fanned out to us here.
  void gattc_event_handler(esp_gattc_cb_event_t event, esp_gatt_if_t gattc_if,
                           esp_ble_gattc_cb_param_t *param) override;

  // on_image listeners subscribe here; OnImageTrigger's ctor calls this.
  void add_on_image_callback(std::function<void(const uint8_t *, size_t)> &&cb) {
    this->image_callback_.add(std::move(cb));
  }

 protected:
  enum State {
    ST_IDLE,       // nothing pending; a poll/pull starts a transfer
    ST_WAIT_HELLO, // REQ sent, waiting for HELLO
    ST_RECV_DATA,  // HELLO_ACK sent, receiving DATA*..DONE (with NAK recovery)
  };
  enum PState { P_SYNC1, P_SYNC2, P_HDR, P_PAYLOAD, P_CRC };

  void start_request_();  // reset parser, send REQ, -> ST_WAIT_HELLO
  void parse_byte_(uint8_t b);
  void handle_frame_(uint8_t mtype, uint16_t seq, const uint8_t *pl, uint16_t pllen, bool ok);
  void send_frame_(uint8_t mtype, uint16_t seq, const uint8_t *pl, uint16_t pllen);
  void abort_();  // reset to ST_IDLE
  void reset_parser_() {
    this->pstate_ = P_SYNC1;
    this->hlen_ = 0;
    this->pgot_ = 0;
    this->cgot_ = 0;
  }
  // True once discovery resolved both chars AND the notify subscribe is confirmed.
  bool ready_() const {
    return this->node_state == espbt::ClientState::ESTABLISHED && this->write_handle_ != 0 &&
           this->notify_handle_ != 0;
  }

  // --- BLE transport state (the only truly new members vs the UART requester) ---
  // Fixed UUIDs, built once from the dashed 36-char form (ble_uuid.h:32).
  espbt::ESPBTUUID svc_uuid_{espbt::ESPBTUUID::from_raw(IMGX_BLE_SVC_UUID)};
  espbt::ESPBTUUID write_uuid_{espbt::ESPBTUUID::from_raw(IMGX_BLE_WRITE_UUID)};
  espbt::ESPBTUUID notify_uuid_{espbt::ESPBTUUID::from_raw(IMGX_BLE_NOTIFY_UUID)};
  // Cache HANDLES (uint16_t), NOT BLECharacteristic* — the parent frees all service/
  // characteristic objects once all nodes reach ESTABLISHED (ble_client.cpp:54-57).
  uint16_t write_handle_{0};
  uint16_t notify_handle_{0};

  // Reassembly buffer (PSRAM, allocated once in setup()).
  uint8_t *img_{nullptr};
  size_t img_len_{0};       // total image size announced in HELLO
  uint32_t want_crc_{0};    // whole-image CRC32 announced in HELLO
  uint16_t rx_chunk_{IMGX_CHUNK};  // negotiated chunk size
  uint16_t nchunks_{0};
  uint16_t nak_rounds_{0};
  bool received_[IMGX_MAX_CHUNKS];  // per-chunk received flags for NAK detection

  State state_{ST_IDLE};
  uint32_t last_activity_{0};

  // Incremental IMGX frame parser (byte-at-a-time, resyncs on 0xA5 0xA5).
  PState pstate_{P_SYNC1};
  uint8_t hdr_[5];
  uint8_t hlen_{0};
  uint8_t mtype_{0};
  uint16_t rseq_{0};
  uint16_t plen_{0};
  uint16_t pgot_{0};
  uint8_t pl_[IMGX_PARSER_PL_MAX];  // >= 512: holds a full DATA payload
  uint8_t crcb_[2];
  uint8_t cgot_{0};

  CallbackManager<void(const uint8_t *, size_t)> image_callback_{};
};

// Trigger<const uint8_t *, size_t>: re-emits the component's image callback into
// YAML actions on a CRC-OK completed image.
class OnImageTrigger : public Trigger<const uint8_t *, size_t> {
 public:
  explicit OnImageTrigger(ImgxBleRequester *parent) {
    parent->add_on_image_callback(
        [this](const uint8_t *data, size_t len) { this->trigger(data, len); });
  }
};

// imgx_ble_requester.pull action.
template<typename... Ts> class PullAction : public Action<Ts...> {
 public:
  explicit PullAction(ImgxBleRequester *parent) : parent_(parent) {}
  void play(Ts... x) override { this->parent_->pull(); }

 protected:
  ImgxBleRequester *parent_;
};

}  // namespace esphome::imgx_ble_requester

#endif  // USE_ESP32
