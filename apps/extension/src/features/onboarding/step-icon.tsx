import type { ComponentType, FC } from "react";
import type { StepStatus } from "./onboarding.types";

type Props = {
  icon: ComponentType<{ className?: string }>;
  status: StepStatus;
};

export const StepIcon: FC<Props> = ({ icon: Icon, status }) => (
  <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-lg ${status === "success" ? "bg-success/10 text-success" : "bg-accent/10 text-accent"}`}>
    <Icon className="h-6 w-6" />
  </div>
);