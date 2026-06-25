import { useTranslations } from "next-intl";
import type { FC, ReactElement, ReactNode } from "react";

type HostHeroProps = {
  children?: ReactNode;
};

export const HostHero: FC<HostHeroProps> = ({ children }): ReactElement => {
  const t = useTranslations("host-page");

  return (
    <div className="min-w-0 py-12 text-center">
      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-accent/10 text-accent border border-accent/20 text-[11px] font-bold uppercase tracking-wider mb-4">
        {t("badge")}
      </div>

      <h1 className="mx-auto mb-4 max-w-2xl text-balance text-[2.5rem] font-extrabold tracking-tight">
        {t("title")}
      </h1>

      <p className="mx-auto max-w-md text-balance text-muted-foreground">
        {t("description")}
      </p>

      {children ? (
        <div className="mt-8">
          {children}
        </div>
      ) : null}
    </div>
  );
};
