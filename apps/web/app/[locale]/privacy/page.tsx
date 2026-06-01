import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { FC, ReactElement } from "react";

type Props = {
  params: Promise<{ locale: string }>;
};

const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Legal" });
  return { title: t("privacy.title") };
};

const PrivacyPage: FC = async (): Promise<ReactElement> => {
  return (
    <main className="max-w-3xl mx-auto px-6 py-24">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Privacy Policy</h1>

      <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6 text-muted-foreground">
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor,
          nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget ultricies
          nisl nisl eget nisl.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-10 mb-4">
          1. Information We Collect
        </h2>
        <p>
          Pellentesque habitant morbi tristique senectus et netus et malesuada
          fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae,
          ultricies eget, tempor sit amet, ante.
        </p>
        <p>
          Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae
          est. Mauris placerat eleifend leo. Quisque sit amet est et sapien
          ullamcorper pharetra.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-10 mb-4">
          2. How We Use Your Information
        </h2>
        <p>
          Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet,
          ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi
          vitae est.
        </p>
        <p>
          Mauris placerat eleifend leo. Quisque sit amet est et sapien
          ullamcorper pharetra. Vestibulum erat wisi, condimentum sed, commodo
          vitae, ornare sit amet, wisi.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-10 mb-4">
          3. Data Sharing
        </h2>
        <p>
          Aenean fermentum, elit eget tincidunt condimentum, eros ipsum rutrum
          orci, sagittis tempus lacus enim ac dui. Donec non enim in turpis
          pulvinar facilisis.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-10 mb-4">
          4. Contact
        </h2>
        <p>
          Ut felis. Praesent dapibus, neque id cursus faucibus, tortor neque
          egestas augue, eu vulputate magna eros eu erat. Aliquam erat volutpat.
        </p>
      </div>
    </main>
  );
};

export { generateMetadata };
export default PrivacyPage;
