import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC, ReactElement } from "react";

export const HostGuide: FC = (): ReactElement => {
  const t = useTranslations("HostPage");

  const steps = [
    { step: "01", title: t("step1Title"), description: t("step1Desc") },
    { step: "02", title: t("step2Title"), description: t("step2Desc") },
    { step: "03", title: t("step3Title"), description: t("step3Desc"), link: { href: "/library", label: t("step3Link") } },
    { step: "04", title: t("step4Title"), description: t("step4Desc") },
  ];

  return (
    <section className="mb-16">
      <h2 className="text-2xl font-bold tracking-tight mb-8">
        {t("guideTitle")}
      </h2>

      <div className="space-y-6">
        {steps.map((item) => (
          <div key={item.step} className="flex gap-6">
            <span className="text-accent font-mono text-sm font-bold shrink-0 mt-1">
              {item.step}
            </span>
            <div>
              <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
              {"link" in item && item.link ? (
                <Link
                  href={item.link.href}
                  className="text-accent text-sm font-medium hover:underline mt-2 inline-block"
                >
                  {item.link.label} &rarr;
                </Link>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};