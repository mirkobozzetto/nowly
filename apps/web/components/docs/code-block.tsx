import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { codeToHtml } from "shiki";

type CodeBlockProps = {
  className?: string;
  children: ReactNode;
};

const getCodeText = (children: ReactNode): string => {
  if (typeof children === "string") return children.trimEnd();
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(getCodeText).join("");

  return "";
};

const normalizeLanguage = (language: string): string => {
  const aliases: Record<string, string> = {
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    sh: "bash",
    shell: "bash",
    zsh: "bash",
    ps: "powershell",
    ps1: "powershell",
  };

  return aliases[language] ?? language;
};

export const CodeBlock = async ({ className, children }: CodeBlockProps) => {
  const match = /language-([\w-]+)/.exec(className || "");
  const lang = match ? match[1] : "";
  const code = getCodeText(children);

  let highlightedCode: string | null = null;

  if (lang) {
    try {
      highlightedCode = await codeToHtml(code, {
        lang: normalizeLanguage(lang),
        theme: "github-dark",
      });
    } catch {
      highlightedCode = null;
    }
  }

  return (
    <div className="group relative my-6">
      {lang && (
        <div className="absolute right-0 top-0 z-10 rounded-bl-lg rounded-tr-lg border-b border-l border-border bg-card-2 px-3 py-1 text-xs font-medium text-muted-foreground/60">
          {lang}
        </div>
      )}

      {highlightedCode ? (
        <div
          className={cn(
            "overflow-hidden rounded-lg border border-border bg-card text-sm leading-relaxed",
            "[&_pre]:m-0 [&_pre]:overflow-x-auto [&_pre]:bg-transparent! [&_pre]:p-4",
            "[&_code]:font-mono [&_code]:text-sm"
          )}
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      ) : (
        <pre
          className={cn(
            "overflow-x-auto rounded-lg border border-border bg-card p-4 text-sm leading-relaxed",
            "scrollbar-thin scrollbar-thumb-card-hover"
          )}
        >
          <code className={cn("font-mono", className)}>{children}</code>
        </pre>
      )}
    </div>
  );
};