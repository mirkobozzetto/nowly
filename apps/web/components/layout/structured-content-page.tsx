import type { FC, ReactElement, ReactNode } from "react";

export type StructuredContentItem = {
  id?: string
  title: string
  description: string
};

type Props = {
  badge?: string
  title: string
  description?: string
  lastUpdated?: string
  intro?: string
  items: StructuredContentItem[]
  showAnchorLinks?: boolean
  children?: ReactNode
};

const richTextClassName = [
  "leading-relaxed space-y-2",
  "[&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:no-underline",
  "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_li]:pl-1",
  "[&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5",
].join(" ");

export const StructuredContentPage: FC<Props> = ({
  badge,
  title,
  description,
  lastUpdated,
  intro,
  items,
  showAnchorLinks = false,
  children,
}): ReactElement => {
  const hasHeroHeader = badge || description;

  return (
    <main className="mx-auto w-full max-w-3xl min-w-0 px-6 py-24">
      {children}

      {hasHeroHeader ? (
        <div className="mb-12 min-w-0 py-12 text-center">
          {badge ? (
            <div className="mb-4 inline-flex items-center gap-2 rounded border border-accent/20 bg-accent/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-accent">
              {badge}
            </div>
          ) : null}

          <h1 className="mx-auto mb-4 max-w-3xl text-balance text-[2rem] font-extrabold tracking-tight md:text-[2.25rem]">
            {title}
          </h1>

          {description ? (
            <p className="mx-auto max-w-2xl text-balance text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      ) : (
        <h1 className="mb-12 wrap-break-word text-3xl font-bold tracking-tight">
          {title}
        </h1>
      )}

      <div className="min-w-0 space-y-12 text-muted-foreground">
        {lastUpdated ? (
          <p className="text-sm text-dim-foreground">{lastUpdated}</p>
        ) : null}

        {intro ? (
          <div
            className={richTextClassName}
            dangerouslySetInnerHTML={{ __html: intro }}
          />
        ) : null}

        {items.map((item, i) => {
          const num = String(i + 1).padStart(2, "0");
          const sectionId = item.id;

          return (
            <section id={sectionId} key={item.title} className="scroll-mt-24 min-w-0">
              <span className="text-accent font-mono text-sm font-bold block mb-3">
                {num}
              </span>
              <h2 className="group mb-4 flex min-w-0 items-start gap-2 wrap-break-word text-xl font-semibold text-foreground">
                <span className="min-w-0 flex-1">{item.title}</span>
                {showAnchorLinks && sectionId ? (
                  <a
                    href={`#${sectionId}`}
                    aria-label={item.title}
                    className="shrink-0 text-accent opacity-60 transition-opacity hover:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  >
                    #
                  </a>
                ) : null}
              </h2>
              <div
                className={richTextClassName}
                dangerouslySetInnerHTML={{ __html: item.description }}
              />
            </section>
          );
        })}
      </div>
    </main>
  );
};