"use client";

import { API_BASE_URL } from "@/lib/constants";
import { metadataToPlatform } from "@/lib/data/presence-adapter";
import type { Platform } from "@/lib/data/platforms";
import { useQuery } from "@tanstack/react-query";
import type { Metadata } from "@nowly/websites";

const fetchPresences = async (): Promise<Platform[]> => {
  const res = await fetch(`${API_BASE_URL}/presences`);

  if (!res.ok) throw new Error("Failed to fetch presences");

  const metadata: Metadata[] = await res.json();

  return metadata.map(metadataToPlatform);
};

const usePresences = () => {
  return useQuery<Platform[]>({
    queryKey: ["presences"],
    queryFn: fetchPresences,
  });
};

export { usePresences };
