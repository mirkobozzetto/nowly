import { DiscordIcon } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FC, ReactElement } from "react";

const DISCORD_COMMUNITY_URL = "https://discord.gg/JRH9dyrVZX";

export const FaqSection: FC = (): ReactElement => {
  const t = useTranslations("HomeFaqSection");
  const items = t.raw("items") as Array<{
    question: string
    answer: string
  }>;

  return (
    <section className="py-24 border-b border-border">
      <div className="max-w-300 mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-12 items-start">
          <div>
            <span className="text-accent font-bold uppercase tracking-widest text-xs mb-4 block">
              {t("sectionLabel")}
            </span>

            <h2 className="text-[2.5rem] mb-4">
              {t("title")}
            </h2>

            <p className="text-muted-foreground leading-relaxed">
              {t("description")}
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              <Link href="/faq" className={buttonVariants({ variant: "primary", size: "md" })}>
                {t("faqCta")}
                <ArrowRight className="h-4 w-4" />
              </Link>

              <a
                href={DISCORD_COMMUNITY_URL}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ variant: "secondary", size: "md" }))}
              >
                <DiscordIcon />
                {t("discordCta")}
              </a>
            </div>
          </div>

          <div className="grid gap-4">
            {items.map((item, index) => (
              <article
                key={item.question}
                className="rounded-lg border border-border bg-card p-6"
              >
                <span className="text-accent font-mono text-sm font-bold mb-3 block">
                  0{index + 1}
                </span>
                <h3 className="text-lg font-semibold mb-2">
                  {item.question}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
