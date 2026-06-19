import { DiscordIcon } from "@/components/icons";
import { SupportCard, type SupportCardProps } from "@/components/support/support-card";
import { SupportHero } from "@/components/support/support-hero";
import { Button } from "@/components/ui/button";
import {
  DISCORD_INVITE_URL,
  PROJECT_BROKEN_PRESENCE_URL,
  PROJECT_BUG_REPORT_URL,
  PROJECT_FEATURE_REQUEST_URL,
  PROJECT_ISSUES_URL,
  PROJECT_NEW_PRESENCE_URL
} from "@/lib/constants";
import { createMetadata } from "@/lib/seo";
import { Bug, ExternalLink, Lightbulb, MessageSquare, PlusCircle, Wrench } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import type { ReactElement, SVGProps } from "react";

const DiscordSupportIcon = ({ className, ...props }: SVGProps<SVGSVGElement>): ReactElement => (
  <DiscordIcon className={className} fill="currentColor" {...props} />
);

const generateMetadata = (): Metadata => {
  return createMetadata({
    title: "Nowly Support",
    description: "Get help with Nowly, report a broken presence, request a platform, or suggest an improvement.",
    path: "/support",
  });
};

const Page = async (): Promise<ReactElement> => {
  const t = await getTranslations("support-page");

  const cards: SupportCardProps[] = [
    {
      title: t("discord.title"),
      description: t("discord.description"),
      href: DISCORD_INVITE_URL,
      icon: DiscordSupportIcon,
      tone: "discord",
    },
    {
      title: t("brokenPresence.title"),
      description: t("brokenPresence.description"),
      href: PROJECT_BROKEN_PRESENCE_URL,
      icon: Wrench,
    },
    {
      title: t("bugReport.title"),
      description: t("bugReport.description"),
      href: PROJECT_BUG_REPORT_URL,
      icon: Bug,
    },
    {
      title: t("newPresence.title"),
      description: t("newPresence.description"),
      href: PROJECT_NEW_PRESENCE_URL,
      icon: PlusCircle,
    },
    {
      title: t("featureRequest.title"),
      description: t("featureRequest.description"),
      href: PROJECT_FEATURE_REQUEST_URL,
      icon: Lightbulb,
    },
    {
      title: t("blankIssue.title"),
      description: t("blankIssue.description"),
      href: `${PROJECT_ISSUES_URL}/new`,
      icon: MessageSquare,
    },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl min-w-0 px-6 py-24">
      <SupportHero
        badge={t("badge")}
        title={t("title")}
        description={t("description")}
      />

      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <SupportCard key={card.href} {...card} />
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <Button asChild variant="ghost" size="sm">
          <Link href={PROJECT_ISSUES_URL} target="_blank" rel="noopener noreferrer">
            {t("browseIssues")}
            <ExternalLink className="size-4" />
          </Link>
        </Button>
      </div>
    </main>
  );
};

export { generateMetadata };

export default Page;
