"use client";

import type { FC, ReactElement } from "react";

export const CompanionWindow: FC = (): ReactElement => {
  return (
    <div className="perspective-[1000px] relative">
      <div className="bg-[#202020] border border-[#333] rounded-lg shadow-[0_0_0_1px_rgba(0,0,0,0.8),0_25px_50px_-12px_rgba(0,0,0,0.9),0_0_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden transform rotate-y-[-5deg] rotate-x-2 animate-float min-h-50 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Presentation Image</p>
      </div>
    </div>
  );
};
