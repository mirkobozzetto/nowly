export const NATIVE_HOST = "nowly.client";
export const EXT_WEB_SOURCE = "Nowly";
export const WEB_BASE_URL = import.meta.env.VITE_WEB_BASE_URL?.replace(/\/$/, "") ?? "https://nowly.me";
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "https://api.nowly.me";
export const CDN_BASE_URL = import.meta.env.VITE_CDN_BASE_URL?.replace(/\/$/, "") ?? "https://cdn.nowly.me";