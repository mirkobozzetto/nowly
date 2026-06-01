import { Monitor } from "lucide-react";
import type { FC, ReactElement } from "react";
import type { LocalePreference } from "../../shared/i18n";

type Props = {
  locale: LocalePreference;
};

export const LocaleIcon: FC<Props> = ({ locale }): ReactElement => {
  if (locale === "browser") {
    return <Monitor className="h-3.5 w-3.5" />;
  }

  if (locale === "fr") {
    return (
      <span className="flex h-3.5 w-4 overflow-hidden rounded-[2px] border border-border/70">
        <span className="w-1/3 bg-[#0055a4]" />
        <span className="w-1/3 bg-white" />
        <span className="w-1/3 bg-[#ef4135]" />
      </span>
    );
  }

  if (locale === "es") {
    return (
      <span className="flex h-3.5 w-4 overflow-hidden rounded-[2px] border border-border/70">
        <span className="h-1/4 w-full bg-[#aa151b]" />
        <span className="h-1/2 w-full bg-[#f1bf00]" />
        <span className="h-1/4 w-full bg-[#aa151b]" />
      </span>
    );
  }

  return (
    <span className="flex h-3.5 w-4 overflow-hidden rounded-[2px] border border-border/70">
      <span className="w-1/2 bg-white" />
      <span className="w-1/2 bg-[#d91c1c]" />
    </span>
  );
};
