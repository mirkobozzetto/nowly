import { registerAlarmHandlers } from "./alarms";
import { initializeBackground, registerLifecycleHandlers } from "./lifecycle";
import { registerRuntimeMessageRouter } from "./message-router";
import { registerPresenceRuntimeBridge } from "./presence-runtime-bridge";

registerRuntimeMessageRouter();
registerPresenceRuntimeBridge();
registerLifecycleHandlers();
registerAlarmHandlers();
initializeBackground();