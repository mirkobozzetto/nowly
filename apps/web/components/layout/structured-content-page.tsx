import type { FC, ReactElement, ReactNode } from "react";

export type StructuredContentItem = {
  title: string
  description: string
};

type Props = {
  title: string
  lastUpdated?: string
  intro?: string
  items: StructuredContentItem[]
  children?: ReactNode
};

const richTextClassName = [
  "leading-relaxed space-y-2",
  "[&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:no-underline",
  "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_li]:pl-1",
].join(" ");

export const StructuredContentPage: FC<Props> = ({
  title,
  lastUpdated,
  intro,
  items,
  children,
}): ReactElement => {
  return (
    <main className="mx-auto w-full max-w-3xl min-w-0 px-6 py-24">
      {children}

      <h1 className="mb-12 wrap-break-word text-3xl font-bold tracking-tight">
        {title}
      </h1>

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

          return (
            <section key={item.title} className="min-w-0">
              <span className="text-accent font-mono text-sm font-bold block mb-3">
                {num}
              </span>
              <h2 className="mb-4 wrap-break-word text-xl font-semibold text-foreground">
                {item.title}
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