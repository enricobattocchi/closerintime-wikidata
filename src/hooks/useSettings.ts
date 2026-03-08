"use client";

import { useState, useEffect, useCallback } from "react";
import type { TimespanFormat } from "@/lib/types";

const STORAGE_KEY = "timespanformat";
const THEME_KEY = "theme";

export type Theme = "system" | "light" | "dark";

export function useSettings() {
  const [timespanFormat, setTimespanFormat] = useState<TimespanFormat>(2);
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setTimespanFormat(Number(stored) as TimespanFormat);
      }
      const storedTheme = localStorage.getItem(THEME_KEY);
      if (storedTheme === "light" || storedTheme === "dark") {
        setTheme(storedTheme);
      }
    } catch {}
  }, []);

  const updateTimespanFormat = useCallback((format: TimespanFormat) => {
    setTimespanFormat(format);
    try {
      localStorage.setItem(STORAGE_KEY, String(format));
    } catch {}
  }, []);

  const updateTheme = useCallback((t: Theme) => {
    setTheme(t);
    try {
      if (t === "system") {
        localStorage.removeItem(THEME_KEY);
        document.documentElement.removeAttribute("data-theme");
      } else {
        localStorage.setItem(THEME_KEY, t);
        document.documentElement.setAttribute("data-theme", t);
      }
    } catch {}
  }, []);

  return { timespanFormat, updateTimespanFormat, theme, updateTheme };
}
