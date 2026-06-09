import matter from "gray-matter";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { DocContent, DocNavigationItem, DocSection } from "./types";

const DOCS_ROOT = join(process.cwd(), "content", "docs");
const SUPPORTED_LOCALES = ["en-US", "fr-FR", "es-ES"];

type FolderInfo = {
  order: number;
  slug: string;
};

const parseOrderedFolder = (name: string): FolderInfo | null => {
  const match = /^(\d+)-(.+)$/.exec(name);
  if (!match) return null;

  return {
    order: Number(match[1]),
    slug: match[2],
  };
};

const getValidLocale = (locale: string): string => {
  return SUPPORTED_LOCALES.includes(locale) ? locale : "en-US";
};

const readCategoryTitle = (categoryPath: string, slug: string): Record<string, string> => {
  const metaPath = join(categoryPath, "_meta.json");

  if (!existsSync(metaPath)) {
    return { "en-US": slug };
  }

  const meta = JSON.parse(readFileSync(metaPath, "utf-8"));
  return meta.title ?? { "en-US": slug };
};

const readOrderedDirectories = (root: string): Array<FolderInfo & { path: string }> => {
  if (!existsSync(root)) return [];

  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const parsed = parseOrderedFolder(entry.name);
      if (!parsed) return null;

      return {
        ...parsed,
        path: join(root, entry.name),
      };
    })
    .filter((entry): entry is FolderInfo & { path: string } => Boolean(entry))
    .sort((a, b) => a.order - b.order);
};

export const getDocsNav = (): DocSection[] => {
  return readOrderedDirectories(DOCS_ROOT)
    .filter((category) => existsSync(join(category.path, "_meta.json")))
    .map((category) => ({
      slug: category.slug,
      order: category.order,
      title: readCategoryTitle(category.path, category.slug),
      path: category.path,
      children: readOrderedDirectories(category.path).map((page) => ({
        slug: page.slug,
        order: page.order,
        title: { "en-US": page.slug },
        path: page.path,
        children: [],
      })),
    }))
    .filter((category) => category.children.length > 0);
};

const getLocalizedTitle = (title: Record<string, string>, locale: string, fallback: string): string => {
  return title[locale] ?? title["en-US"] ?? fallback;
};

const readDocFile = (page: DocSection, locale: string): { raw: string } | null => {
  const validLocale = getValidLocale(locale);
  const localizedPath = join(page.path, `${validLocale}.mdx`);
  const fallbackPath = join(page.path, "en-US.mdx");

  if (existsSync(localizedPath)) {
    return { raw: readFileSync(localizedPath, "utf-8") };
  }

  if (existsSync(fallbackPath)) {
    return { raw: readFileSync(fallbackPath, "utf-8") };
  }

  return null;
};

const findCategory = (slug: string): DocSection | null => {
  return getDocsNav().find((section) => section.slug === slug) ?? null;
};

const findPage = (slug: string): { category: DocSection; page: DocSection } | null => {
  const parts = slug.split("/").filter(Boolean);
  const categorySlug = parts.length > 1 ? parts[0] : null;
  const pageSlug = parts.at(-1);

  if (!pageSlug) return null;

  for (const category of getDocsNav()) {
    if (categorySlug && category.slug !== categorySlug) continue;

    const page = category.children.find((child) => child.slug === pageSlug);
    if (page) return { category, page };
  }

  return null;
};

export const getFirstDocPath = (): string => {
  const firstCategory = getDocsNav()[0];
  const firstPage = firstCategory?.children[0];

  if (!firstCategory || !firstPage) return "getting-started/introduction";

  return `${firstCategory.slug}/${firstPage.slug}`;
};

export const getNavigationItems = (locale: string): DocNavigationItem[] => {
  const validLocale = getValidLocale(locale);

  return getDocsNav().map((category) => ({
    slug: category.slug,
    title: getLocalizedTitle(category.title, validLocale, category.slug),
    description: "",
    order: category.order,
    path: category.slug,
    children: category.children.map((page) => {
      const docFile = readDocFile(page, validLocale);
      const data = docFile ? matter(docFile.raw).data : {};

      return {
        slug: page.slug,
        title: typeof data.title === "string" ? data.title : page.slug,
        description: typeof data.description === "string" ? data.description : "",
        order: page.order,
        path: `${category.slug}/${page.slug}`,
        children: [],
      };
    }),
  }));
};

export const getDocContent = (slug: string, locale: string): DocContent | null => {
  const resolved = findPage(slug);
  if (!resolved) return null;

  const docFile = readDocFile(resolved.page, locale);
  if (!docFile) return null;

  const { data, content } = matter(docFile.raw);
  const path = `${resolved.category.slug}/${resolved.page.slug}`;

  return {
    slug: resolved.page.slug,
    path,
    sourcePath: `${resolved.category.order}-${resolved.category.slug}/${resolved.page.order}-${resolved.page.slug}`,
    title: typeof data.title === "string" ? data.title : resolved.page.slug,
    description: typeof data.description === "string" ? data.description : "",
    content,
    frontmatter: data,
  };
};

export const getCategoryForPath = (slug: string, locale: string): string => {
  const validLocale = getValidLocale(locale);
  const categorySlug = slug.split("/").filter(Boolean)[0];
  const category = categorySlug ? findCategory(categorySlug) : null;

  return category ? getLocalizedTitle(category.title, validLocale, category.slug) : "Documentation";
};

export const getAdjacentPages = (
  slug: string,
  locale: string
): { prev: DocNavigationItem | null; next: DocNavigationItem | null } => {
  const items = getNavigationItems(locale).flatMap((category) =>
    category.children.map((page) => ({
      ...page,
      slug: page.path,
    }))
  );
  const normalizedSlug = findPage(slug)
    ? getDocContent(slug, locale)?.path ?? slug
    : slug;
  const index = items.findIndex((item) => item.slug === normalizedSlug);

  return {
    prev: index > 0 ? items[index - 1] : null,
    next: index < items.length - 1 ? items[index + 1] : null,
  };
};