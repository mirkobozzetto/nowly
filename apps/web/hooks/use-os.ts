import { useEffect, useState } from "react";

export type Os = "windows" | "macos" | "linux" | "android" | "ios" | "";

const detect = (): Os => {
  const ua = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();

  if (/iphone|ipad|ipod/.test(ua) || /iphone|ipad|ipod/.test(platform)) return "ios";
  if (ua.includes("android")) return "android";
  if (ua.includes("win") || platform.includes("win")) return "windows";
  if (ua.includes("mac") || platform.includes("mac")) return "macos";
  if (ua.includes("linux") || platform.includes("linux")) return "linux";
  return "";
};

export const useOs = (): Os => {
  const [os, setOs] = useState<Os>("");

  useEffect(() => {
    setOs(detect());
  }, []);

  return os;
};
