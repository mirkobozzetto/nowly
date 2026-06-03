"use client";

import { LocaleFlag } from "@/components/locale-flag";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type { FC } from "react";

export const LocaleSelector: FC = () => {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("Footer");

  const handleLocaleChange = (value: string): void => {
    document.cookie = `locale=${value};path=/;max-age=31536000;SameSite=Lax`;
    router.refresh();
  };

  return (
    <div className="flex justify-start">
      <Select value={locale} onValueChange={handleLocaleChange}>
        <SelectTrigger className="">
          <LocaleFlag locale={locale} />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fr-FR">{t("french")}</SelectItem>
          <SelectItem value="en-US">{t("english")}</SelectItem>
          <SelectItem value="es-ES">{t("spanish")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
