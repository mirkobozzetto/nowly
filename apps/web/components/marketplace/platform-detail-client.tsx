"use client"

import { useLocale, useTranslations } from "next-intl"
import Link from "next/link"
import type { FC, ReactElement } from "react"
import { useState } from "react"

import { PlatformIcon } from "@/components/marketplace/platform-utils"
import { KofiModal } from "@/components/ui/kofi-modal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { type Platform } from "@/lib/data/platforms"

type Props = {
  platform: Platform
}

type InstallBadgeProps = {
  isInstalled: boolean
  status: string
}

const InstallBadge: FC<InstallBadgeProps> = ({ isInstalled, status }): ReactElement => {
  const t = useTranslations("MarketplaceDetail")

  if (status === "soon") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-[0.05em] bg-card-2 text-dim-foreground border border-border border-dashed">
        {t("comingSoon")}
      </span>
    )
  }

  if (status === "beta") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-[0.05em] bg-amber-500/10 text-amber-500 border border-amber-500/20">
        {t("betaLabel")}
      </span>
    )
  }

  if (isInstalled) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-[0.05em] bg-success/10 text-success border border-success/20">
        {t("installed")}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-[0.05em] bg-card-2 text-dim-foreground border border-border border-dashed">
      {t("ready")}
    </span>
  )
}

export const PlatformDetailClient: FC<Props> = ({ platform }): ReactElement => {
  const locale = useLocale()
  const t = useTranslations("MarketplaceDetail")
  const tCategories = useTranslations("MarketplacePage")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  const categoryLabel = tCategories(`categories.${platform.category}`)
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  const toggleInstall = (): void => {
    setIsInstalled(!isInstalled)
  }

  return (
    <>
      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-300 mx-auto px-6">
          <nav className="flex items-center gap-2 text-sm text-dim-foreground mb-8">
            <Link href={`/${locale}/marketplace`} className="hover:text-foreground transition-colors">
              {t("breadcrumbHome")}
            </Link>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6" />
            </svg>
            <span className="text-foreground">{platform.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)] gap-8">
            <div className="space-y-8">
              <div className="bg-card border border-border rounded-xl p-8">
                <div className="flex items-start gap-6">
                  <div
                    className="w-20 h-20 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${platform.iconColor}15` }}
                  >
                    <PlatformIcon icon={platform.icon} color={platform.iconColor} className="w-12 h-12" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h1 className="text-3xl font-extrabold tracking-tight">{platform.name}</h1>
                      <InstallBadge isInstalled={isInstalled} status={platform.status} />
                    </div>

                    <p className="text-muted-foreground mb-4">{platform.description}</p>

                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-card-2 text-sm text-muted-foreground border border-border">
                      {categoryLabel}
                    </span>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-border">
                  <h2 className="text-xl font-bold mb-4">{t("about")}</h2>
                  <p className="text-muted-foreground leading-relaxed">{platform.longDescription}</p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-8">
                <h2 className="text-xl font-bold mb-4">{t("supportedUrls")}</h2>
                <div className="flex flex-wrap gap-2">
                  {platform.supportedUrls.map((url, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card-2 text-sm text-muted-foreground border border-border font-mono"
                    >
                      <svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                      {url}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-8">
                <h2 className="text-xl font-bold mb-4">{t("features")}</h2>
                <ul className="space-y-3">
                  {platform.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3 text-muted-foreground">
                      <svg className="w-5 h-5 text-success shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-6">
              {platform.contributors.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h2 className="text-xl font-bold mb-4">{t("contributors")}</h2>
                  <div className="space-y-3">
                    {platform.contributors.map((contributor, index) => (
                      <a
                        key={index}
                        href={contributor.github ? `https://github.com/${contributor.github}` : undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg bg-card-2 hover:bg-card-hover px-3 py-2 transition-colors"
                      >
                        <Avatar className="h-8 w-8 shrink-0">
                          {contributor.avatar ? (
                            <AvatarImage src={contributor.avatar} alt={contributor.name} />
                          ) : null}
                          <AvatarFallback>{contributor.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-foreground">{contributor.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-sm font-bold text-dim-foreground uppercase tracking-widest mb-4">
                  {t("stats")}
                </h3>
                <div className="space-y-4">
                  {platform.status !== "soon" && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">{t("activeUsers")}</span>
                        <span className="font-semibold">{platform.activeUsers.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">{t("totalInstalls")}</span>
                        <span className="font-semibold">{platform.totalInstalls.toLocaleString()}</span>
                      </div>
                      {platform.rating > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">{t("rating")}</span>
                          <span className="flex items-center gap-1 font-semibold">
                            <svg className="w-4 h-4 fill-amber-500" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            {platform.rating}/5
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("addedAt")}</span>
                    <span className="font-semibold">{dateFormatter.format(new Date(platform.addedAt))}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("lastUpdated")}</span>
                    <span className="font-semibold">{dateFormatter.format(new Date(platform.lastUpdated))}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-b from-card to-surface border border-border rounded-xl p-6 text-center">
                {platform.status === "available" || platform.status === "beta" ? (
                  <>
                    <h3 className="font-bold mb-2">
                      {isInstalled ? t("installed") : t("ready")}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {isInstalled
                        ? t("activeDescription", { platform: platform.name })
                        : t("addDescription", { platform: platform.name })}
                    </p>
                    <button
                      onClick={toggleInstall}
                      className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                        isInstalled
                          ? "bg-success/10 text-success border border-success/20 hover:bg-success/20"
                          : "bg-foreground text-background hover:bg-[#e4e4e7]"
                      }`}
                    >
                      {isInstalled ? (
                        <>
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                          {t("installedAction")}
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          {t("installAction")}
                        </>
                      )}
                    </button>
                    {platform.status === "beta" && (
                      <p className="text-xs text-amber-500 mt-2">{t("betaNote")}</p>
                    )}
                  </>
                ) : (
                  <>
                    <h3 className="font-bold mb-2">{t("comingSoon")}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t("comingSoonDescription", { platform: platform.name })}
                    </p>
                    <button
                      disabled
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm bg-card-2 text-muted-foreground border border-border cursor-not-allowed opacity-60"
                    >
                      {t("waiting")}
                    </button>
                  </>
                )}
              </div>

              <Link
                href={`/${locale}/marketplace`}
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m15 18-6-6 6-6" />
                </svg>
                {t("back")}
              </Link>
            </div>
          </div>
        </div>
      </main>
      <KofiModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
