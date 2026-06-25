import { CheckCircle2, LoaderCircle, XCircle } from "lucide-react";
import type { FC } from "react";

export type RowStatus = "loading" | "success" | "error";

type Props = {
  status: RowStatus;
};

export const StatusIcon: FC<Props> = ({ status }) => {
  if (status === "loading") {
    return <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />;
  }

  if (status === "success") {
    return <CheckCircle2 className="h-4 w-4 text-success" />;
  }

  return <XCircle className="h-4 w-4 text-destructive" />;
};