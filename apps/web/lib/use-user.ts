"use client";

import {
  cleanupUrlError,
  cleanupUrlToken,
  clearToken,
  getErrorFromUrl,
  getStoredToken,
  getTokenFromUrl,
  storeToken,
} from "@/lib/auth";
import { API_BASE_URL } from "@/lib/constants";
import { useCallback, useEffect, useState } from "react";

export interface DiscordUser {
  discordId: string
  username: string
  globalName: string
  avatar: string | null
  avatar_url: string | null
}

export const useUser = () => {
  const [token, setToken] = useState<string | null>(getStoredToken);
  const [user, setUser] = useState<DiscordUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const urlToken = getTokenFromUrl();
    if (urlToken) {
      storeToken(urlToken);
      setToken(urlToken);
      cleanupUrlToken();
    }

    const urlError = getErrorFromUrl();
    if (urlError) {
      cleanupUrlError();
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok && !cancelled) {
          setUser(await res.json() as DiscordUser);
        } else if (!cancelled) {
          clearToken();
          setToken(null);
          setUser(null);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchUser();

    return () => { cancelled = true; };
  }, [token]);

  const login = useCallback(() => {
    const redirect = encodeURIComponent(window.location.origin + window.location.pathname);
    window.location.href = `${API_BASE_URL}/auth/discord?redirect=${redirect}`;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setToken(null);
    setUser(null);
  }, []);

  return { user, token, loading, isAuthenticated: !!user, login, logout };
};
