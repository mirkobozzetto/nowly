import { useEffect, useState } from "react";

const detect = (): string => {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("edg/") || ua.includes("edgios")) return "Edge";
  if (ua.includes("brave")) return "Brave";
  if (ua.includes("opr/") || ua.includes("opera")) return "Opera";
  if (ua.includes("chrome/") || ua.includes("chromium")) return "Chrome";
  if (ua.includes("firefox/")) return "Firefox";
  if (ua.includes("safari/")) return "Safari";
  return "";
};

export const useBrowser = (): string => {
  const [browser, setBrowser] = useState("");

  useEffect(() => {
    setBrowser(detect());
  }, []);

  return browser;
};