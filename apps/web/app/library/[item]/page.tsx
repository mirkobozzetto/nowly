import { presenceApi } from "@/lib/presence-api";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import type { PresenceRelease } from "./fetch-presence";
import { createPresenceMetadata, renderPresencePage } from "./presence-page";

type Props = {
  params: Promise<{
    item: string
  }>
};

const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { item: raw } = await params;
  const item = raw.toLowerCase();
  const data = await presenceApi.get<PresenceRelease>(`/${item}`).catch(() => null);

  if (!data) {
    return { title: "Not Found" };
  }

  return createPresenceMetadata(item, data, `/library/${item}`);
};

const Page = async ({ params }: Props): Promise<ReactElement> => {
  const { item: raw } = await params;
  return renderPresencePage(raw.toLowerCase());
};

export { generateMetadata };

export default Page;