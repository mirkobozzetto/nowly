"use client"

import { useTranslations } from "next-intl"
import type { FC, ReactElement } from "react"
import { useEffect, useState } from "react"
import { Button, buttonVariants } from "@/components/l-ui/button"
import { KofiModal } from "@/components/ui/kofi-modal"

type BrowserType = "chrome" | "edge" | "firefox" | "safari" | "other"

const detectBrowser = (): BrowserType => {
  if (typeof window === "undefined") return "chrome"
  
  const ua = navigator.userAgent.toLowerCase()
  
  if (ua.includes("edg/")) return "edge"
  if (ua.includes("chrome") && !ua.includes("edg/")) return "chrome"
  if (ua.includes("firefox")) return "firefox"
  if (ua.includes("safari") && !ua.includes("chrome")) return "safari"
  
  return "other"
}

const isChromiumBased = (browser: BrowserType): boolean => {
  return browser === "chrome" || browser === "edge"
}

export const CtaSection: FC = (): ReactElement => {
  const [browser, setBrowser] = useState<BrowserType>("chrome")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const t = useTranslations("CtaSection")

  useEffect(() => {
    setBrowser(detectBrowser())
  }, [])

  const isSupported = isChromiumBased(browser)
  const browserLabel = browser === "chrome"
    ? "Chrome"
    : browser === "edge"
      ? "Edge"
      : browser === "firefox"
        ? "Firefox"
        : browser === "safari"
          ? "Safari"
          : t("browser")

  const handleDownload = (): void => {
    if (!isSupported) return
    setIsModalOpen(true)
  }

  return (
    <>
      <section id="download" className="py-24">
        <div className="max-w-[1200px] mx-auto px-6 relative z-[2]">
          <div className="bg-gradient-to-b from-card to-surface border border-border rounded-xl p-16 text-center">
            <h2 className="text-[2.5rem] font-extrabold tracking-tight mb-4">
              {t("title")}
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {t("description")}
            </p>
            
            <div className="flex gap-4 justify-center flex-wrap">
              {isSupported ? (
                <Button
                  onClick={handleDownload}
                  variant="primary"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {t("downloadFor", {browser: browserLabel})}
                </Button>
              ) : (
                <Button
                  disabled
                  variant="secondary"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {t("comingSoon", {browser: browserLabel})}
                </Button>
              )}

              <a 
                href="https://github.com/q-kimi/Presence-Discord/raw/main/dist/Presence-Discord-Extension.zip" 
                download="Presence-Discord-Extension.zip"
                className={buttonVariants({ variant: "secondary" })}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {t("extension")}
              </a>
            </div>

            <div className="flex justify-center gap-6 flex-wrap mt-8 pt-8 border-t border-border">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="4"/>
                  <line x1="21.17" y1="8" x2="12" y2="8"/>
                  <line x1="3.95" y1="6.06" x2="8.54" y2="14"/>
                  <line x1="10.88" y1="21.94" x2="15.46" y2="14"/>
                </svg>
                {t("platforms")}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                {t("openSource")}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                {t("free")}
              </div>
            </div>
          </div>
        </div>
      </section>

      <KofiModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
