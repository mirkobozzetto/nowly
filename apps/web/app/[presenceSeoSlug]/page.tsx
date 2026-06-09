import { presenceApi } from "@/lib/presence-api";
import { buildPresenceSeoPath, parsePresenceSeoSlug } from "@/lib/seo-presence";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import type { PresenceRelease } from "../library/[item]/fetch-presence";
import { createPresenceMetadata, renderPresencePage } from "../library/[item]/presence-page";

type Props = {
  params: Promise<{
    presenceSeoSlug: string
  }>
};

const resolvePresenceSlug = (value: string): string => {
  const slug = parsePresenceSeoSlug(value);

  if (!slug) {
    notFound();
  }

  return slug;
};

const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { presenceSeoSlug } = await params;
  const item = resolvePresenceSlug(presenceSeoSlug);
  const data = await presenceApi.get<PresenceRelease>(`/${item}`).catch(() => null);

  if (!data) {
    return { title: "Not Found" };
  }

  return createPresenceMetadata(item, data, buildPresenceSeoPath(item));
};

const Page = async ({ params }: Props): Promise<ReactElement> => {
  const { presenceSeoSlug } = await params;
  const item = resolvePresenceSlug(presenceSeoSlug);

  return renderPresencePage(item, item);
};

export { generateMetadata };

export default Page;