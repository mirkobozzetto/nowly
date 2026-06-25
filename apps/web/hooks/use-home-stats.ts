"use client";

import { API_BASE_URL } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";

export type HomeStats = {
  totalUsers: number
  activeUsers: number
  activePresenceCount: number
  installedPresenceCount: number
};

const HOME_STATS_KEY = ["home-stats"] as const;

const fetchHomeStats = async (): Promise<HomeStats> => {
  const res = await fetch(`${API_BASE_URL}/presences/stats`);

  if (!res.ok) throw new Error("Failed to fetch home stats");

  return res.json() as Promise<HomeStats>;
};

export const useHomeStats = () => {
  return useQuery<HomeStats>({
    queryKey: HOME_STATS_KEY,
    queryFn: fetchHomeStats,
    staleTime: 60 * 1000,
  });
};