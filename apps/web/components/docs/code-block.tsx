import { cn } from "@/lib/utils";
import type { FC, ReactNode } from "react";

type CodeBlockProps = {
  className?: string;
  children: ReactNode;
};

export const CodeBlock: FC<CodeBlockProps> = ({ className, children }) => {
  const match = /language-(\w+)/.exec(className || "");
  const lang = match ? match[1] : "";

  return (
    <div className="group relative my-6">
      {lang && (
        <div className="absolute top-0 right-0 px-3 py-1 text-xs font-medium text-muted-foreground/60 bg-card-2 rounded-bl-lg rounded-tr-lg border-l border-b border-border">
          {lang}
        </div>
      )}
      <pre
        className={cn(
          "overflow-x-auto rounded-lg border border-border bg-card p-4 text-sm leading-relaxed",
          "scrollbar-thin scrollbar-thumb-card-hover"
        )}
      >
        <code className={cn("font-mono", className)}>{children}</code>
      </pre>
    </div>
  );
};