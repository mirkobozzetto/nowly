import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { FC, ReactElement } from "react";

type Props = {
  params: Promise<{ locale: string }>;
};

const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Legal" });
  return { title: t("changelog.title") };
};

const ChangelogPage: FC = async (): Promise<ReactElement> => {
  return (
    <main className="max-w-3xl mx-auto px-6 py-24">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Changelog</h1>

      <div className="space-y-10 text-muted-foreground">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-1">
            v0.2.0
          </h2>
          <p className="text-sm text-dim-foreground mb-3">
            Lorem ipsum dolor sit amet
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Pellentesque habitant morbi tristique senectus</li>
            <li>Et netus et malesuada fames ac turpis egestas</li>
            <li>Vestibulum tortor quam feugiat vitae</li>
            <li>Ultricies eget tempor sit amet ante</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-1">
            v0.1.0
          </h2>
          <p className="text-sm text-dim-foreground mb-3">
            Consectetur adipiscing elit
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Donec eu libero sit amet quam egestas semper</li>
            <li>Aenean ultricies mi vitae est</li>
            <li>Mauris placerat eleifend leo</li>
            <li>Quisque sit amet est et sapien ullamcorper pharetra</li>
          </ul>
        </div>
      </div>
    </main>
  );
};

export { generateMetadata };
export default ChangelogPage;
