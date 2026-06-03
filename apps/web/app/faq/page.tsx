import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { FC, ReactElement } from "react";

type Props = {
  params: Promise<{ locale: string }>;
};

const generateMetadata = (): Metadata => {
  return {
    title: "FAQ — Nowly",
    description: "Frequently asked questions about the Nowly browser extension, installation, supported platforms, privacy and more.",
    openGraph: {
      title: "FAQ — Nowly",
      description: "Frequently asked questions about the Nowly browser extension, installation, supported platforms, privacy and more.",
    },
  };
};

const FaqPage: FC<Props> = async ({ params }: Props): Promise<ReactElement> => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "FaqPage" });

  return (
    <main className="max-w-3xl mx-auto px-6 py-24">
      <h1 className="text-3xl font-bold tracking-tight mb-12">
        {t("title")}
      </h1>

      <div className="space-y-12 text-muted-foreground">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i}>
            <span className="text-accent font-mono text-sm font-bold block mb-3">
              0{i + 1}
            </span>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {t(`q${i + 1}`)}
            </h2>
            <div
              className="leading-relaxed space-y-2 [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:no-underline"
              dangerouslySetInnerHTML={{ __html: t.raw(`a${i + 1}`) as string }}
            />
          </div>
        ))}
      </div>
    </main>
  );
};

export { generateMetadata };
export default FaqPage;
