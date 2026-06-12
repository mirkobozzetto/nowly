import { useOs, type Os } from "./use-os";

export type Platform = Extract<Os, "windows" | "macos" | "linux"> | "";

export const usePlatform = (): Platform => {
  const os = useOs();

  return os === "windows" || os === "macos" || os === "linux" ? os : "";
};
