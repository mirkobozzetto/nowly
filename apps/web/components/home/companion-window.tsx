"use client";

import Image from "next/image";
import type { FC, ReactElement } from "react";

export const CompanionWindow: FC = (): ReactElement => {
  return (
    <div className="perspective-[1000px] relative">
      <div className="overflow-hidden transform rotate-y-[-5deg] rotate-x-2 animate-float min-h-50 flex items-center justify-center">
        <Image
          src="/assets/extension_1.png"
          alt="Companion Window"
          width={500}
          height={100}
          className="object-cover w-82"
          loading="eager"
        />
      </div>
    </div>
  );
};