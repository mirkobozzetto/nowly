"use client";

import { useSidebar } from "@/components/ui/sidebar-context";
import type { DocNavigationItem } from "@/lib/docs/types";
import { cn } from "@/lib/utils";
import { ChevronRight, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type FC } from "react";

type AppSidebarProps = {
  items: DocNavigationItem[];
};

export const AppSidebar: FC<AppSidebarProps> = ({ items }) => {
  const t = useTranslations("Docs");
  const { open: mobileOpen, setOpen: setMobileOpen } = useSidebar();
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpanded = (slug: string) => {
    setExpanded((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  const sidebarContent = (
    <nav>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        {t("documentation")}
      </p>

      <ul className="space-y-0.5">
        {items.map((item) => {
          const isActive = pathname === `/docs/${item.slug}`;
          const hasChildren = item.children.length > 0;
          const isExpanded = expanded[item.slug] ?? false;

          return (
            <li key={item.slug}>
              <div className="flex items-center">
                {hasChildren && (
                  <button
                    type="button"
                    onClick={() => toggleExpanded(item.slug)}
                    className="flex items-center justify-center w-7 h-7 shrink-0 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-card-hover"
                    aria-label={isExpanded ? t("collapse") : t("expand")}
                  >
                    <ChevronRight
                      size={14}
                      className={cn(
                        "shrink-0 transition-transform",
                        isExpanded && "rotate-90"
                      )}
                    />
                  </button>
                )}

                <Link
                  href={`/docs/${item.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors flex-1",
                    isActive
                      ? "bg-accent/10 text-accent font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-card-hover"
                  )}
                >
                  {item.title}
                </Link>
              </div>

              {hasChildren && isExpanded && (
                <ul className="ml-4 mt-0.5 space-y-0.5 border-l border-border">
                  {item.children.map((child) => {
                    const isChildActive = pathname === `/docs/${item.slug}/${child.slug}`;

                    return (
                      <li key={child.slug}>
                        <Link
                          href={`/docs/${item.slug}/${child.slug}`}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "block rounded-lg px-3 py-1.5 text-sm transition-colors ml-3",
                            isChildActive
                              ? "text-accent font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-card-hover"
                          )}
                        >
                          {child.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <>
      <aside className="hidden lg:block w-56 shrink-0">
        <div className="fixed top-24 w-56 max-h-[calc(100vh-8rem)] overflow-y-auto">
          {sidebarContent}
        </div>
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r border-border p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm font-semibold text-foreground">{t("documentation")}</p>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};