"use client";

import { ADSENSE_CLIENT_ID, ADSENSE_ENABLED } from "@/lib/constants";
import type { FC, ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

type AdStatus = {
  loading: boolean
  extDetected: boolean
  hasAds: boolean
  adFree: boolean
  deviceId: string | null
  refresh: () => void
};

type Props = {
  children: ReactNode
};

const EXT_SOURCE = "Nowly";
const SCRIPT_ID = "nowly-adsense-script";
const EXT_TIMEOUT_MS = 2500;

const AdStatusContext = createContext<AdStatus>({
  loading: true,
  extDetected: false,
  hasAds: true,
  adFree: false,
  deviceId: null,
  refresh: () => {},
});

let messageId = 0;
const nextId = (): string => {
  messageId += 1;
  return `ads_${messageId}_${Date.now()}`;
};

const requestAdStatus = (): void => {
  window.postMessage({ source: EXT_SOURCE, type: "GET_AD_STATUS", messageId: nextId() }, "*");
};

const AdSenseScriptLoader: FC<{ enabled: boolean }> = ({ enabled }) => {
  useEffect(() => {
    if (!enabled || !ADSENSE_ENABLED || process.env.NODE_ENV === "development") return;
    if (document.getElementById(SCRIPT_ID)) return;

    window.adsbygoogle = window.adsbygoogle || [];
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
    document.head.appendChild(script);
  }, [enabled]);

  return null;
};

export const AdStatusProvider: FC<Props> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [extDetected, setExtDetected] = useState(false);
  const [hasAds, setHasAds] = useState(true);
  const [adFree, setAdFree] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  const refresh = useCallback((): void => {
    if (typeof window === "undefined") return;
    setLoading(true);
    requestAdStatus();
  }, []);

  useEffect(() => {
    if (!ADSENSE_ENABLED || process.env.NODE_ENV === "development") {
      setLoading(false);
      return;
    }

    const ping = window.setInterval(() => {
      window.postMessage({ source: EXT_SOURCE, type: "PING" }, "*");
    }, 300);

    const timeout = window.setTimeout(() => {
      window.clearInterval(ping);
      setLoading(false);
    }, EXT_TIMEOUT_MS);

    const handler = (event: MessageEvent): void => {
      const msg = event.data ?? {};

      if (msg.type === "EXT_DETECTED") {
        setExtDetected(true);
        window.clearInterval(ping);
        requestAdStatus();
      }

      if (msg.source === EXT_SOURCE && msg.type === "AD_STATUS") {
        const payload = msg.payload as { hasAds?: unknown; adFree?: unknown; deviceId?: unknown } | undefined;
        const nextAdFree = payload?.adFree === true;
        setAdFree(nextAdFree);
        setHasAds(nextAdFree ? false : payload?.hasAds !== false);
        setDeviceId(typeof payload?.deviceId === "string" ? payload.deviceId : null);
        setLoading(false);
        window.clearInterval(ping);
        window.clearTimeout(timeout);
      }
    };

    window.addEventListener("message", handler);

    return () => {
      window.removeEventListener("message", handler);
      window.clearInterval(ping);
      window.clearTimeout(timeout);
    };
  }, []);

  const value = useMemo<AdStatus>(() => ({
    loading,
    extDetected,
    hasAds,
    adFree,
    deviceId,
    refresh,
  }), [adFree, deviceId, extDetected, hasAds, loading, refresh]);

  return (
    <AdStatusContext.Provider value={value}>
      <AdSenseScriptLoader enabled={!loading && hasAds && !adFree} />
      {children}
    </AdStatusContext.Provider>
  );
};

export const useAdStatus = (): AdStatus => useContext(AdStatusContext);
