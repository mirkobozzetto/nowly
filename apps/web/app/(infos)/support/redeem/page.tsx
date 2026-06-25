import { SupportHero } from "@/components/support/support-hero";
import { createMetadata } from "@/lib/seo";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { RedeemSupportCard } from "./redeem-support-card";

const generateMetadata = (): Metadata => {
  return createMetadata({
    title: "Activate supporter key",
    description: "Activate a Nowly supporter key on this browser.",
    path: "/support/redeem",
  });
};

const Page = async (): Promise<ReactElement> => {
  const t = await getTranslations("support-redeem-page");

  return (
    <main className="mx-auto flex w-full max-w-5xl min-w-0 flex-1 flex-col px-6 py-24">
      <SupportHero
        badge={t("badge")}
        title={t("title")}
        description={t("description")}
      />

      <RedeemSupportCard />
    </main>
  );
};

export { generateMetadata };

export default Page;
