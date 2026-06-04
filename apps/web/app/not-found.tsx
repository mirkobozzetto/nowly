"use client";

import { buttonVariants } from "@/components/ui/button";
import { Frown, Home } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactElement } from "react";

const NotFound = (): ReactElement => {
  const t = useTranslations("NotFound");

  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="mb-8">
          <Frown className="mx-auto h-12 w-12 text-muted-foreground" />
        </div>

        <h1 className="text-6xl font-extrabold tracking-tight mb-4">404</h1>

        <p className="text-muted-foreground mb-8 leading-relaxed">
          {t("description")}
        </p>

        <Link href="/" className={buttonVariants({ variant: "primary", size: "md" })}>
          <Home className="w-4 h-4" />
          {t("backToHome")}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;