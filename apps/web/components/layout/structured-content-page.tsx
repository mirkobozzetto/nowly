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
    <main className="max-w-3xl mx-auto px-6 py-24">
      {children}

      <h1 className="text-3xl font-bold tracking-tight mb-12">
        {title}
      </h1>

      <div className="space-y-12 text-muted-foreground">
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
            <section key={item.title}>
              <span className="text-accent font-mono text-sm font-bold block mb-3">
                {num}
              </span>
              <h2 className="text-xl font-semibold text-foreground mb-4">
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