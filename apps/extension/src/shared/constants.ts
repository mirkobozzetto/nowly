import { extensionEnv } from "@nowly/env/extension";

export const NATIVE_HOST = "nowly.client";
export const EXT_WEB_SOURCE = "Nowly";
export const WEB_BASE_URL = extensionEnv.VITE_WEB_BASE_URL;
export const API_BASE_URL = extensionEnv.VITE_API_BASE_URL;
export const CDN_BASE_URL = extensionEnv.VITE_CDN_BASE_URL;
