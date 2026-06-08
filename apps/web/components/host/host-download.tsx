import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import type { FC, ReactElement } from "react";

type DownloadOption = {
  label: string;
  url: string;
};

type PlatformConfig = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  downloads: DownloadOption[];
};

type Props = {
  config: PlatformConfig;
};

export const HostDownload: FC<Props> = ({ config }): ReactElement => {
  return (
    <div className="flex flex-col items-center gap-2">
      {config.downloads.map((dl, i) => (
        <Link
          key={dl.url}
          href={dl.url}
          download
          className={buttonVariants({
            variant: i === 0 ? "accent" : "secondary",
            size: "sm",
            class: "w-full max-w-sm",
          })}
        >
          {dl.label}
        </Link>
      ))}
    </div>
  );
};