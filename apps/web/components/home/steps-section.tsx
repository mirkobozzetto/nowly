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
      <div className="max-w-300 mx-auto px-6 relative z-2">
        <div className="text-center max-w-150 mx-auto mb-16">
          <span className="text-accent font-bold uppercase tracking-widest text-xs mb-4 block">
            {t("sectionLabel")}
          </span>
          <h2 className="text-[2.5rem] mb-4">
            {t("title")}
          </h2>
          <p className="text-muted-foreground">
            {t("description")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="bg-card border border-border p-8 rounded-xl"
            >
              <span className="text-accent font-mono text-sm font-bold mb-4 block">
                0{index + 1}
              </span>
              <h3 className="text-lg font-bold mb-2">{step.title}</h3>
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