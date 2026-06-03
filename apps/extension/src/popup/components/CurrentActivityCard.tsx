import { CirclePlay } from "lucide-react";
import type { FC, ReactElement } from "react";
import { assetUrl } from "@/shared/api";
import { t } from "@/shared/i18n";
import type { CurrentActivity, InstalledPresences } from "@/shared/types";
import { formatRelativeTime, getActivitySubtitle, getActivityTitle } from "@/popup/lib/format";

type Props = {
  activity: CurrentActivity | null;
  presences: InstalledPresences;
};

export const CurrentActivityCard: FC<Props> = ({ activity, presences }): ReactElement => {
  const presence = activity ? presences[activity.slug] : null;
  const hasActivity = Boolean(activity);
  const largeImage = activity?.presence.largeImage;
  const hasLargeImage = Boolean(largeImage);
  const title = getActivityTitle(activity, t("nothingPlaying"));
  const subtitle = getActivitySubtitle(activity, presence?.metadata.name ?? "0:00 / 0:00");
  const updatedAt = formatRelativeTime(activity?.updatedAt);
  const progress = getProgress(activity);

  return (
    <section className="relative overflow-hidden rounded-lg border border-border bg-card">
      {hasLargeImage && (
        <>
          <div
            className="absolute -inset-x-16 -inset-y-10 bg-cover bg-center opacity-65 blur-3xl saturate-50"
            style={{ backgroundImage: `url("${largeImage}")` }}
          />
          <div className="absolute inset-0 bg-linear-to-b from-card/70 via-card/80 to-card" />
        </>
      )}

      <div className="relative z-1 flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t("current")}</h2>
        </div>
      </div>

      <div className="relative z-1 flex items-center gap-3 p-4">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-card-2 ${
            hasLargeImage ? "border border-border shadow-[0_10px_30px_rgba(0,0,0,.45)]" : ""
          }`}
          style={{ backgroundColor: presence ? `${presence.metadata.color}20` : undefined }}
        >
          {hasLargeImage ? (
            <img src={largeImage} alt="" className="h-full w-full object-cover" />
          ) : presence ? (
            <img src={assetUrl(presence.metadata.slug, "icon")} alt="" className="h-10 w-10 object-contain" />
          ) : (
            <CirclePlay className="h-8 w-8 text-dim-foreground" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
          {progress ? (
            <div className="mt-3">
              <div className="h-1 overflow-hidden rounded-full bg-accent/15">
                <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${progress.percent}%` }} />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{progress.elapsed}</span>
                <span>{progress.duration}</span>
              </div>
            </div>
          ) : (
            <p className="mt-3 truncate text-[11px] text-muted-foreground">
              {presence?.metadata.name ?? t("appName")}
              {updatedAt ? ` - ${updatedAt}` : ""}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

const formatTime = (seconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;
  const paddedSeconds = String(remainingSeconds).padStart(2, "0");

  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${paddedSeconds}`;
  return `${minutes}:${paddedSeconds}`;
};

const getProgress = (
  activity: CurrentActivity | null,
): { duration: string; elapsed: string; percent: number } | null => {
  const startTime = activity?.presence.startTime;
  const endTime = activity?.presence.endTime;
  if (!startTime || !endTime || endTime <= startTime) return null;

  const now = Math.floor(Date.now() / 1000);
  const duration = endTime - startTime;
  const elapsed = Math.min(Math.max(now - startTime, 0), duration);

  return {
    duration: formatTime(duration),
    elapsed: formatTime(elapsed),
    percent: Math.min(100, Math.max(0, (elapsed / duration) * 100)),
  };
};
