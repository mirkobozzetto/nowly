import { useEffect, useState } from "react";

export type Platform = "windows" | "macos" | "linux" | "";

const detect = (): Platform => {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("win")) return "windows";
  if (ua.includes("mac")) return "macos";
  if (ua.includes("linux")) return "linux";
  return "";
};

export const usePlatform = (): Platform => {
  const [platform, setPlatform] = useState<Platform>("");

  useEffect(() => {
    setPlatform(detect());
  }, []);

  return platform;
};