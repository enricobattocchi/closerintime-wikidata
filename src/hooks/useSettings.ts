"use client";

import { useState, useEffect, useCallback } from "react";
import type { TimespanFormat } from "@/lib/types";

const STORAGE_KEY = "timespanformat";

export function useSettings() {
  const [timespanFormat, setTimespanFormat] = useState<TimespanFormat>(2);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setTimespanFormat(Number(stored) as TimespanFormat);
      }
    } catch {}
  }, []);

  const updateTimespanFormat = useCallback((format: TimespanFormat) => {
    setTimespanFormat(format);
    try {
      localStorage.setItem(STORAGE_KEY, String(format));
    } catch {}
  }, []);

  return { timespanFormat, updateTimespanFormat };
}
