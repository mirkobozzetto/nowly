"use client";

import { Search } from "lucide-react";
import type { FC } from "react";

type Props = {
  value: string
  placeholder: string
  onChange: (value: string) => void
};

export const MarketplaceSearch: FC<Props> = ({ value, placeholder, onChange }) => (
  <div className="relative mb-6">
    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dim-foreground" />
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder:text-dim-foreground focus:outline-none focus:border-accent transition-colors"
    />
  </div>
);
