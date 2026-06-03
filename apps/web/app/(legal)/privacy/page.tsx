import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { FC, ReactElement } from "react";

type Props = {
  params: Promise<{ locale: string }>;
};

const generateMetadata = (): Metadata => {
  return {
    title: "Privacy Policy — Nowly",
    description: "Privacy Policy for Nowly. Learn how your data is processed locally and what information is collected.",
    openGraph: {
      title: "Privacy Policy — Nowly",
      description: "Privacy Policy for Nowly. Learn how your data is processed locally and what information is collected.",
    },
  };
};

const Page: FC<Props> = async ({ params }: Props): Promise<ReactElement> => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PrivacyPage" });

  return (
    <main className="max-w-3xl mx-auto px-6 py-24">
      <h1 className="text-3xl font-bold tracking-tight mb-12">
        {t("title")}
      </h1>

      <div className="space-y-12 text-muted-foreground">
        <p className="text-sm text-dim-foreground">{t("lastUpdated")}</p>
        <div
          className="leading-relaxed space-y-2 [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:no-underline"
          dangerouslySetInnerHTML={{ __html: t.raw("intro") as string }}
        />

        {Array.from({ length: 11 }, (_, i) => {
          const num = String(i + 1).padStart(2, "0");
          return (
            <div key={i}>
              <span className="text-accent font-mono text-sm font-bold block mb-3">{num}</span>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                {t(`s${num}title`)}
              </h2>
              <div
                className="leading-relaxed space-y-2 [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:no-underline"
                dangerouslySetInnerHTML={{ __html: t.raw(`s${num}body`) as string }}
              />
            </div>
          );
        })}
      </div>
    </main>
  );
};

export { generateMetadata };
export default Page;
