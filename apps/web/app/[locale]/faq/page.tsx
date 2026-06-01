import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { FC, ReactElement } from "react";

type Props = {
  params: Promise<{ locale: string }>;
};

const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Legal" });
  return { title: t("faq.title") };
};

const FaqPage: FC = async (): Promise<ReactElement> => {
  return (
    <main className="max-w-3xl mx-auto px-6 py-24">
      <h1 className="text-3xl font-bold tracking-tight mb-8">FAQ</h1>

      <div className="space-y-6 text-muted-foreground">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Lorem ipsum dolor sit amet?
          </h2>
          <p>
            Pellentesque habitant morbi tristique senectus et netus et malesuada
            fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae,
            ultricies eget, tempor sit amet, ante.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Consectetur adipiscing elit?
          </h2>
          <p>
            Donec eu libero sit amet quam egestas semper. Aenean ultricies mi
            vitae est. Mauris placerat eleifend leo. Quisque sit amet est et
            sapien ullamcorper pharetra.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Nullam auctor nisl eget ultricies?
          </h2>
          <p>
            Vestibulum erat wisi, condimentum sed, commodo vitae, ornare sit
            amet, wisi. Aenean fermentum, elit eget tincidunt condimentum.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            How does vestibulum tortor work?
          </h2>
          <p>
            Ut felis. Praesent dapibus, neque id cursus faucibus, tortor neque
            egestas augue, eu vulputate magna eros eu erat. Aliquam erat
            volutpat.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Is mauris placerat eleifend leo?
          </h2>
          <p>
            Duis arcu tortor, suscipit eget, imperdiet nec, imperdiet iaculis,
            ipsum. Sed aliquam ultrices mauris. Integer ante arcu, accumsan a,
            consectetuer eget, posuere ut, mauris.
          </p>
        </div>
      </div>
    </main>
  );
};

export { generateMetadata };
export default FaqPage;
