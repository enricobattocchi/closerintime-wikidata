"use client";

import { useRef, useCallback } from "react";
import type { Event } from "@/lib/types";

export function useExport(allSelected: Event[]) {
  const exportRef = useRef<HTMLDivElement>(null);

  const handleExport = useCallback(async () => {
    const container = exportRef.current;
    if (!container) return;
    const html2canvas = (await import("html2canvas")).default;

    // Check explicit theme first, then fall back to system preference
    const dataTheme = document.documentElement.getAttribute("data-theme");
    const isDark = dataTheme === "dark" ||
      (dataTheme !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    // Hide elements that shouldn't appear in the image
    container.setAttribute("data-exporting", "");
    // Force 1200px width off-screen for consistent export size
    const origStyles = container.style.cssText;
    container.style.width = "1200px";
    container.style.position = "absolute";
    container.style.left = "-9999px";
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: isDark ? "#101418" : "#f8f9fa",
    });
    container.style.cssText = origStyles;
    container.removeAttribute("data-exporting");
    const link = document.createElement("a");
    const names = allSelected
      .map((e) => e.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, ""))
      .join("-");
    link.download = `wiki-closerintime-${names || "timeline"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [allSelected]);

  return { exportRef, handleExport };
}
