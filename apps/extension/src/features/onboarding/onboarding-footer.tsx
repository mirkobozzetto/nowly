import { Button } from "@/components/ui/button";
import { t } from "@/shared/i18n";
import type { FC } from "react";

type Props = {
  canReplayNext: boolean;
  canReplayPrevious: boolean;
  devReplayOnboarding: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSkipTour: () => void;
  showSkip: boolean;
};

const buttonClassName = "rounded-lg border border-border bg-card-2 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground";
const disabledClassName = "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-card-2 disabled:hover:text-muted-foreground";

export const OnboardingFooter: FC<Props> = ({
  canReplayNext,
  canReplayPrevious,
  devReplayOnboarding,
  onNext,
  onPrevious,
  onSkipTour,
  showSkip,
}) => {
  if (devReplayOnboarding) {
    return (
      <footer className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
        <Button
          variant="unstyled"
          size="none"
          disabled={!canReplayPrevious}
          onClick={onPrevious}
          className={`${buttonClassName} ${disabledClassName}`}
        >
          {t("onboarding-previous")}
        </Button>
        <Button
          variant="unstyled"
          size="none"
          onClick={onSkipTour}
          className={buttonClassName}
        >
          {t("onboarding-finish")}
        </Button>
        <Button
          variant="unstyled"
          size="none"
          disabled={!canReplayNext}
          onClick={onNext}
          className={`${buttonClassName} ${disabledClassName}`}
        >
          {t("onboarding-next")}
        </Button>
      </footer>
    );
  }

  if (!showSkip) return null;

  return (
    <footer className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
      <Button
        variant="unstyled"
        size="none"
        onClick={onSkipTour}
        className={buttonClassName}
      >
        {t("onboarding-skip")}
      </Button>
    </footer>
  );
};