"use client"

import { buttonVariants } from "@/components/l-ui/button"
import { cn } from "@/lib/utils"
import { useLocale, useTranslations } from "next-intl"
import Link from "next/link"
import type { FC, ReactElement } from "react"
import { useEffect, useState } from "react"

export const Navbar: FC = (): ReactElement => {
  const [scrolled, setScrolled] = useState(false)
  const locale = useLocale()
  const t = useTranslations("Navbar")

  useEffect(() => {
    const handleScroll = (): void => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 py-4 transition-all duration-300",
        scrolled && "bg-background/90 backdrop-blur-xl"
      )}
    >
      <div className="max-w-300 mx-auto px-6">
        <div className="flex items-center justify-between">
          <Link href={`/${locale}`} className="flex items-center gap-2.5 font-bold text-base">
            <svg
              className="w-6 h-6 text-accent"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/>
              <path d="M9.17 9.17a6 6 0 0 0 0 5.66"/>
              <path d="M14.83 9.17a6 6 0 0 1 0 5.66"/>
              <path d="M5.64 5.64a12 12 0 0 0 0 12.73"/>
              <path d="M18.36 5.64a12 12 0 0 1 0 12.73"/>
            </svg>

            Presence<span className="text-muted-foreground">Discord</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/marketplace`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              {t("marketplace")}
            </Link>

            <Link
              href="#download"
              className={buttonVariants({ size: "md", variant: "accent" })}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span className="hidden sm:inline">{t("downloadDesktop")}</span>
              <span className="sm:hidden">{t("downloadShort")}</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
