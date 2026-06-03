import { PackageOpen } from "lucide-react";
import type { FC, ReactElement } from "react";
import { t } from "@/shared/i18n";
import { MarketplaceLink } from "./MarketplaceLink";

export const EmptyState: FC = (): ReactElement => (
  <section className="rounded-lg border border-dashed border-border bg-card p-6 text-center">
    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-card-2 text-dim-foreground">
      <PackageOpen className="h-5 w-5" />
    </div>
    <p className="text-sm font-semibold">{t("emptyTitle")}</p>
    <p className="mx-auto mt-1 max-w-60 text-xs leading-5 text-muted-foreground">{t("emptyDescription")}</p>
    <div className="mt-4 flex justify-center">
      <MarketplaceLink />
    </div>
  </section>
);
