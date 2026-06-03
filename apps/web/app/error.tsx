"use client";

import { Button } from "@/components/l-ui/button";
import { CircleAlert, RefreshCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FC, ReactElement } from "react";

type Props = {
  error: Error & { digest?: string }
  reset: () => void
};

const Error: FC<Props> = ({ reset }): ReactElement => {
  const t = useTranslations("ErrorPage");

  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="mb-8">
          <CircleAlert className="mx-auto h-12 w-12 text-destructive" />
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-4">{t("title")}</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">{t("description")}</p>

        <Button onClick={reset} variant="primary" size="md">
          <RefreshCcw className="w-4 h-4" />
          {t("retry")}
        </Button>
      </div>
    </div>
  );
};

export default Error;