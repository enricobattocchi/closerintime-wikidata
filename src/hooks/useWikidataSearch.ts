"use client";

import { useState, useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import type { Event } from "@/lib/types";

export function useWikidataSearch(query: string) {
  const [results, setResults] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const locale = useLocale();

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const timer = setTimeout(() => {
      // Abort previous request only when we're about to send a new one
      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;

      fetch(`/api/search?q=${encodeURIComponent(trimmed)}&lang=${locale}`, {
        signal: controller.signal,
      })
        .then((res) => {
          if (!res.ok) throw new Error("Search failed");
          return res.json();
        })
        .then((data: Event[]) => {
          if (!controller.signal.aborted) {
            setResults(data);
            setIsLoading(false);
          }
        })
        .catch((err) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          if (!controller.signal.aborted) {
            setResults([]);
            setIsLoading(false);
          }
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [query, locale]);

  return { results, isLoading };
}
