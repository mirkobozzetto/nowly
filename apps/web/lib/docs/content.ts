import matter from "gray-matter";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { DocContent, DocNavigationItem, DocSection } from "./types";

const DOCS_ROOT = join(process.cwd(), "content", "docs");

const SUPPORTED_LOCALES = ["en-US", "fr-FR", "es-ES"];

export const getDocsNav = (): DocSection[] => {
  const metaPath = join(DOCS_ROOT, "_meta.json");
  if (!existsSync(metaPath)) return [];

  const meta = JSON.parse(readFileSync(metaPath, "utf-8"));
  return meta.sections as DocSection[];
};

export const getNavigationItems = (locale: string): DocNavigationItem[] => {
  const sections = getDocsNav();
  const validLocale = SUPPORTED_LOCALES.includes(locale) ? locale : "en-US";

  const items: DocNavigationItem[] = [];

  for (const section of sections) {
    const folderName = `${section.order}-${section.slug}`;
    const folderPath = join(DOCS_ROOT, folderName);
    const filePath = join(folderPath, `${validLocale}.mdx`);

    if (!existsSync(filePath)) continue;

    const raw = readFileSync(filePath, "utf-8");
    const { data } = matter(raw);

    items.push({
      slug: section.slug,
      title: section.title[validLocale as keyof typeof section.title] || data.title || section.slug,
      description: data.description || "",
      order: section.order,
      children: [],
    });
  }

  return items.sort((a, b) => a.order - b.order);
};

export const getDocContent = (slug: string, locale: string): DocContent | null => {
  const sections = getDocsNav();
  const validLocale = SUPPORTED_LOCALES.includes(locale) ? locale : "en-US";

  const section = sections.find((s) => s.slug === slug);
  if (!section) return null;

  const folderName = `${section.order}-${section.slug}`;
  const folderPath = join(DOCS_ROOT, folderName);
  const filePath = join(folderPath, `${validLocale}.mdx`);

  if (!existsSync(filePath)) return null;

  const raw = readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    slug: section.slug,
    title: data.title || section.title[validLocale as keyof typeof section.title] || section.slug,
    description: data.description || "",
    content,
    frontmatter: data,
  };
};

export const getAdjacentPages = (
  slug: string,
  locale: string
): { prev: DocNavigationItem | null; next: DocNavigationItem | null } => {
  const items = getNavigationItems(locale);
  const index = items.findIndex((item) => item.slug === slug);

  return {
    prev: index > 0 ? items[index - 1] : null,
    next: index < items.length - 1 ? items[index + 1] : null,
  };
};