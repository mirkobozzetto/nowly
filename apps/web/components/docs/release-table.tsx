import { cn } from "@/lib/utils";
import type { FC, ReactNode } from "react";

type ReleaseTableProps = {
  headers: string[];
  rows: string[][];
  className?: string;
};

export const ReleaseTable: FC<ReleaseTableProps> = ({ headers, rows, className }) => {
  return (
    <div className={cn("my-6 overflow-x-auto rounded-md border border-border", className)}>
      <table className="w-full min-w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {headers.map((header, index) => (
              <th
                key={header}
                className={cn(
                  "px-4 py-3 text-left text-sm font-semibold text-muted-foreground",
                  index < headers.length - 1 && "border-r border-border",
                )}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${rowIndex}-${row.join("|")}`} className="border-b border-border last:border-0 even:bg-muted/20">
              {row.map((cell, cellIndex) => (
                <td
                  key={`${rowIndex}-${cellIndex}`}
                  className={cn(
                    "px-4 py-3 align-top text-foreground/85",
                    cellIndex < row.length - 1 && "border-r border-border",
                  )}
                >
                  {cell as ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
