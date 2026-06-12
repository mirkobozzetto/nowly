import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";

export const StepsSection: FC = (): ReactElement => {
  const t = useTranslations("StepsSection");
  const steps = t.raw("steps") as Array<{
    title: string
    description: string
  }>;

  return (
    <section className="py-24 border-b border-border">
      <div className="relative z-2 mx-auto w-full max-w-300 min-w-0 px-6">
        <div className="mx-auto mb-16 max-w-150 text-center">
          <span className="text-accent font-bold uppercase tracking-widest text-xs mb-4 block">
            {t("sectionLabel")}
          </span>
          <h2 className="mb-4 text-balance text-[2.5rem]">
            {t("title")}
          </h2>
          <p className="text-balance text-muted-foreground">
            {t("description")}
          </p>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="min-w-0 rounded-xl border border-border bg-card p-8"
            >
              <span className="text-accent font-mono text-sm font-bold mb-4 block">
                0{index + 1}
              </span>
              <h3 className="mb-2 wrap-break-word text-lg font-bold">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};