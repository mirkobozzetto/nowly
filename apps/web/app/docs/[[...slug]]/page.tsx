import { EditOnGitHub } from "@/components/docs/edit-on-github";
import { mdxComponents } from "@/components/docs/mdx-components";
import { OpenIn } from "@/components/docs/open-in";
import { PageNavigation } from "@/components/docs/page-navigation";
import { TableOfContents } from "@/components/docs/table-of-contents";
import { getAdjacentPages, getDocContent, getDocsNav } from "@/lib/docs/content";
import { extractTocItems } from "@/lib/docs/types";
import { getLocale } from "next-intl/server";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import remarkGfm from "remark-gfm";

type Props = {
  params: Promise<{
    slug?: string[]
  }>;
};

const Page = async ({ params }: Props): Promise<ReactElement> => {
  const locale = await getLocale();
  const { slug } = await params;

  const pageSlug = slug?.join("/") || "getting-started";
  const doc = getDocContent(pageSlug, locale);

  if (!doc) {
    notFound();
  }

  const tocItems = extractTocItems(doc.content);
  const { prev, next } = getAdjacentPages(pageSlug, locale);

  const sections = getDocsNav();
  const currentSection = sections.find((s) => s.slug === pageSlug);
  const contentSlug = currentSection ? `${currentSection.order}-${currentSection.slug}` : pageSlug;

  return (
    <>
      <article className="py-8">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-3xl font-semibold font-heading">
            {doc.title}
          </h1>
          <OpenIn slug={contentSlug} locale={locale} />
        </div>

        {doc.description && (
          <p className="text-muted-foreground mb-8 text-lg">
            {doc.description}
          </p>
        )}

        <MDXRemote source={doc.content} components={mdxComponents} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />

        <div className="mt-8 flex items-center border-t border-border pt-4">
          <EditOnGitHub slug={contentSlug} locale={locale} />
        </div>

        <PageNavigation prev={prev} next={next} />
      </article>

      <TableOfContents items={tocItems} />
    </>
  );
};

export default Page;