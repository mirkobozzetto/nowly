"use client"

import { useTranslations } from "next-intl"
import type { ReactElement } from "react"

type Props = {
  error: Error & { digest?: string }
  reset: () => void
}

const Error = ({ reset }: Props): ReactElement => {
  const t = useTranslations("ErrorPage")

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="mb-8">
          <svg className="w-16 h-16 mx-auto text-destructive" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">{t("title")}</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">{t("description")}</p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-lg font-semibold text-sm shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_4px_25px_rgba(255,255,255,0.2)] active:scale-[0.98] transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
          {t("retry")}
        </button>
      </div>
    </div>
  )
}

export default Error
