import esphome.codegen as cg
import esphome.config_validation as cv
from esphome import automation
from esphome.const import CONF_ID, CONF_TRIGGER_ID
from esphome.components import ble_client

CODEOWNERS = ["@laris-co"]
# DEPENDENCIES: attaches as a node under a `ble_client:` (which itself DEPENDS on
# esp32_ble_tracker). ble_client owns the connection to the camera peripheral.
# NO camera / NO esp32_ble_server here — this is the CENTRAL (GATT client) side.
DEPENDENCIES = ["ble_client"]

CONF_ON_IMAGE = "on_image"

imgx_req_ns = cg.esphome_ns.namespace("imgx_ble_requester")
# Multiple inheritance mirrors the C++: PollingComponent + ble_client::BLEClientNode.
ImgxBleRequester = imgx_req_ns.class_(
    "ImgxBleRequester", cg.PollingComponent, ble_client.BLEClientNode
)

# Trigger<const uint8_t *, size_t> — fired on a CRC-OK completed image.
# const uint8_t*  == cg.uint8.operator("const").operator("ptr")
# size_t          == cg.size_t
OnImageTrigger = imgx_req_ns.class_(
    "OnImageTrigger",
    automation.Trigger.template(
        cg.uint8.operator("const").operator("ptr"), cg.size_t
    ),
)

# On-demand pull action: imgx_ble_requester.pull
PullAction = imgx_req_ns.class_("PullAction", automation.Action)

CONFIG_SCHEMA = (
    cv.Schema(
        {
            cv.GenerateID(): cv.declare_id(ImgxBleRequester),
            cv.Optional(CONF_ON_IMAGE): automation.validate_automation(
                {cv.GenerateID(CONF_TRIGGER_ID): cv.declare_id(OnImageTrigger)}
            ),
        }
    )
    # Configurable pull interval; default 5s. C++ side is PollingComponent::update().
    .extend(cv.polling_component_schema("5s"))
    # Injects `ble_client_id: <use_id(BLEClient)>` — which ble_client: to attach to.
    .extend(ble_client.BLE_CLIENT_SCHEMA)
)


async def to_code(config):
    var = cg.new_Pvariable(config[CONF_ID])
    await cg.register_component(var, config)
    # register_ble_node resolves config["ble_client_id"] and calls
    # parent.register_ble_node(var). MUST come AFTER register_component so the
    # component/base is wired before the node attaches (mirrors ble_client/sensor).
    await ble_client.register_ble_node(var, config)

    for conf in config.get(CONF_ON_IMAGE, []):
        trigger = cg.new_Pvariable(conf[CONF_TRIGGER_ID], var)
        await automation.build_automation(
            trigger,
            [
                (cg.uint8.operator("const").operator("ptr"), "data"),
                (cg.size_t, "len"),
            ],
            conf,
        )


@automation.register_action(
    "imgx_ble_requester.pull",
    PullAction,
    cv.Schema({cv.GenerateID(): cv.use_id(ImgxBleRequester)}),
)
async def pull_action_to_code(config, action_id, template_arg, args):
    parent = await cg.get_variable(config[CONF_ID])
    return cg.new_Pvariable(action_id, template_arg, parent)
