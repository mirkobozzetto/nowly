import { registerAlarmHandlers } from "./services/alarms";
import { initializeBackground, registerLifecycleHandlers } from "./services/lifecycle";
import { registerRuntimeMessageRouter } from "./services/message-router";
import { registerPresenceRuntimeBridge } from "./runtime/presence-runtime-bridge";

registerRuntimeMessageRouter();
registerPresenceRuntimeBridge();
registerLifecycleHandlers();
registerAlarmHandlers();
initializeBackground();