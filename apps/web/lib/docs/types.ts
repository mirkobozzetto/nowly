import type { LocalizedValue } from "@nowly/locales";

export type DocSection = {
  slug: string;
  order: number;
  title: LocalizedValue<string>;
  path: string;
  children: DocSection[];
};

export type DocNavigationItem = {
  slug: string;
  title: string;
  description: string;
  order: number;
  path: string;
  children: DocNavigationItem[];
};

export type DocContent = {
  slug: string;
  path: string;
  sourcePath: string;
  title: string;
  description: string;
  content: string;
  frontmatter: Record<string, unknown>;
};

export type TocItem = {
  id: string;
  text: string;
  level: number;
};

export const extractTocItems = (content: string): TocItem[] => {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const items: TocItem[] = [];
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    items.push({ id, text, level });
  }

  return items;
};