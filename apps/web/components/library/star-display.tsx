import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import type { FC } from "react";

type Props = {
  filled: boolean
  size?: "sm" | "md"
  color?: string
};

export const StarDisplay: FC<Props> = ({ filled, size = "sm", color }) => (
  <Star
    className={cn({
      "w-3.5 h-3.5": size === "sm",
      "w-5 h-5": size === "md"
    })}
    fill={filled ? color : undefined}
    color={filled ? color : undefined}
  />
);
