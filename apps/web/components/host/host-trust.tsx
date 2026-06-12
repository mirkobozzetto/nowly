import { MonitorCheck, ShieldCheck, ServerOff } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";

const icons = [MonitorCheck, ShieldCheck, ServerOff] as const;

export const HostTrust: FC = (): ReactElement => {
  const t = useTranslations("HostPage");
  const items = t.raw("trustItems") as Array<{
    title: string
    description: string
  }>;

  return (
    <section className="mb-16">
      <div className="mb-8">
        <span className="text-accent font-bold uppercase tracking-widest text-xs mb-4 block">
          {t("trustBadge")}
        </span>
        <h2 className="text-2xl font-bold tracking-tight mb-3">
          {t("trustTitle")}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("trustDescription")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item, index) => {
          const Icon = icons[index] ?? ShieldCheck;

          return (
            <article key={item.title} className="rounded-lg border border-border bg-card p-5">
              <span className="mb-5 flex size-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Icon className="size-5" />
              </span>

              <h3 className="mb-2 font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
};
