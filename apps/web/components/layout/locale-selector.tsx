"use client";

import { SUPPORTED_LOCALES, type LocaleString } from "@nowly/locales";
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

const localeLabelKey: Record<LocaleString, string> = {
  "en-US": "english",
  "fr-FR": "french",
  "es-ES": "spanish",
};

export const LocaleSelector: FC = () => {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("footer");

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
          {SUPPORTED_LOCALES.map((code) => (
            <SelectItem key={code} value={code}>{t(localeLabelKey[code])}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
