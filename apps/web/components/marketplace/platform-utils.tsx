import { type Platform } from "@/lib/data/platforms"
import { useTranslations } from "next-intl"
import type { FC, ReactElement } from "react"

type StatusBadgeProps = {
  status: Platform["status"]
}

export const StatusBadge: FC<StatusBadgeProps> = ({ status }): ReactElement => {
  const t = useTranslations("Common")
  const styles = {
    available: "bg-success/10 text-success border-success/20",
    soon: "bg-muted text-dim-foreground border-border",
    beta: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  }

  const labels = {
    available: t("statusAvailable"),
    soon: t("statusSoon"),
    beta: t("statusBeta"),
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-[0.05em] border ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
