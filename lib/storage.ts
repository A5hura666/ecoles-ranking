"use client";

import { useEffect, useState } from "react";

const RANKING_KEY = "ecoles-classement:ranking:v1";
const GEOCODE_KEY = "ecoles-classement:geocode-cache:v2";

/**
 * Persist an ordered list of school ids representing the user's
 * ranking. Reads once on mount, then mirrors every change to
 * localStorage so the ranking survives a page reload.
 */
export function useRankingStorage() {
  const [ranking, setRanking] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RANKING_KEY);
      if (raw) setRanking(JSON.parse(raw));
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(RANKING_KEY, JSON.stringify(ranking));
    } catch {
      // storage full or unavailable — ranking still works for this session
    }
  }, [ranking, hydrated]);

  return { ranking, setRanking, hydrated };
}

export function readGeocodeCache(): Record<string, { lat: number; lon: number } | null> {
  try {
    const raw = window.localStorage.getItem(GEOCODE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function writeGeocodeCache(cache: Record<string, { lat: number; lon: number } | null>) {
  try {
    window.localStorage.setItem(GEOCODE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}
