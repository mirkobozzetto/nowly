import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";

export const HostHero: FC = (): ReactElement => {
  const t = useTranslations("HostPage");

  return (
    <div className="text-center mb-16">
      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-accent/10 text-accent border border-accent/20 text-[11px] font-bold uppercase tracking-wider mb-4">
        {t("badge")}
      </div>

      <h1 className="text-[2.5rem] font-extrabold tracking-tight mb-4">
        {t("title")}
      </h1>

      <p className="text-muted-foreground max-w-md mx-auto">
        {t("description")}
      </p>
    </div>
  );
};