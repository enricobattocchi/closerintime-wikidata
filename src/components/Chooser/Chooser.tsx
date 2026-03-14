"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import type { Event, MarkerData, SegmentData } from "@/lib/types";
import { useSettings } from "@/hooks/useSettings";
import { useExport } from "@/hooks/useExport";
import { computeTimeline } from "@/lib/timeline-math";
import { buildShareablePath } from "@/lib/custom-event-url";
import EventAutocomplete from "./EventAutocomplete";
import Timeline from "@/components/Timeline/Timeline";
import EditableTitle from "@/components/EditableTitle";
import type { EditableTitleHandle } from "@/components/EditableTitle";
import ShareToolbar from "@/components/ShareToolbar";
import styles from "@/styles/Chooser.module.css";

interface ChooserProps {
  selectedEvents: Event[];
  serverTimeline?: { markers: MarkerData[]; segments: SegmentData[] };
  serverHref?: string;
  serverTitle?: string;
  serverHideNow?: boolean;
}

function buildUrl(path: string, title: string, hideNow: boolean): string {
  const params = new URLSearchParams();
  if (title) params.set("t", title);
  if (hideNow) params.set("now", "0");
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export default function Chooser({
  selectedEvents,
  serverTimeline,
  serverHref,
  serverTitle,
  serverHideNow,
}: ChooserProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("chooser");
  const tCommon = useTranslations("common");
  const tDate = useTranslations("date");
  const { timespanFormat } = useSettings();
  const [selected, setSelected] = useState<Event[]>(selectedEvents);
  const [title, setTitle] = useState(serverTitle || "");
  const [hideNow, setHideNow] = useState(serverHideNow || false);

  // Locale prefix for building URLs
  const localePath = locale === "en" ? "" : `/${locale}`;

  // Sync with server-provided events when they change (navigation)
  useEffect(() => {
    setSelected(selectedEvents);
  }, [selectedEvents]);

  useEffect(() => {
    setTitle(serverTitle || "");
  }, [serverTitle]);

  useEffect(() => {
    setHideNow(serverHideNow || false);
  }, [serverHideNow]);

  const titleRef = useRef<EditableTitleHandle>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollPos, setScrollPos] = useState<"start" | "middle" | "end">("start");
  const [loadingRandom, setLoadingRandom] = useState(false);
  const currentKeys = useMemo(
    () => selected.map((e) => `${e.id}${e.useDeath ? "~d" : ""}`),
    [selected]
  );

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle);
      const path = selected.length > 0 ? `${localePath}${buildShareablePath(selected)}` : `${localePath}/`;
      window.history.replaceState(null, "", buildUrl(path, newTitle, hideNow));
    },
    [selected, hideNow, localePath]
  );

  const handleRandom = useCallback(
    async () => {
      setLoadingRandom(true);
      try {
        const exclude = currentKeys.join(",");
        const res = await fetch(`/api/random${exclude ? `?exclude=${exclude}&lang=${locale}` : `?lang=${locale}`}`);
        const event = await res.json();
        if (event?.id) {
          const next = [...selected, event];
          const path = `${localePath}${buildShareablePath(next)}`;
          router.push(buildUrl(path, title, hideNow));
        }
      } finally {
        setLoadingRandom(false);
      }
    },
    [selected, currentKeys, router, title, hideNow, locale, localePath]
  );

  const handleSelect = useCallback(
    (event: Event) => {
      const next = [...selected, event];
      const path = `${localePath}${buildShareablePath(next)}`;
      router.push(buildUrl(path, title, hideNow));
    },
    [selected, router, title, hideNow, localePath]
  );

  const handleToggleDeath = useCallback(
    (eventKey: string) => {
      const eventIndex = selected.findIndex(
        (e) => `${e.id}${e.useDeath ? "~d" : ""}` === eventKey
      );
      if (eventIndex < 0) return;
      const event = selected[eventIndex];
      if (event.deathYear === null) return;

      const targetUseDeath = !event.useDeath;

      // Check if the target variant already exists in another slot
      const duplicateIndex = selected.findIndex(
        (e, i) => i !== eventIndex && e.id === event.id && e.useDeath === targetUseDeath
      );

      let updated;
      if (duplicateIndex >= 0) {
        // Target variant already selected — just remove this slot
        updated = selected.filter((_, i) => i !== eventIndex);
      } else {
        updated = selected.map((e, i) => {
          if (i !== eventIndex) return e;
          if (targetUseDeath) {
            return { ...e, useDeath: true, dateProperty: "P570" };
          } else {
            return { ...e, useDeath: false, dateProperty: "P569" };
          }
        });
      }

      if (updated.length > 0) {
        const path = `${localePath}${buildShareablePath(updated)}`;
        router.push(buildUrl(path, title, hideNow));
      } else {
        router.push(buildUrl(`${localePath}/`, title, hideNow));
      }
    },
    [selected, router, title, hideNow, localePath]
  );

  const handleRemove = useCallback(
    (eventKey: string) => {
      // Handle removing the "Now" marker
      if (eventKey === "0") {
        setHideNow(true);
        const path = selected.length > 0 ? `${localePath}${buildShareablePath(selected)}` : `${localePath}/`;
        window.history.replaceState(null, "", buildUrl(path, title, true));
        return;
      }

      const remaining = selected.filter(
        (e) => `${e.id}${e.useDeath ? "~d" : ""}` !== eventKey
      );
      // If removing an event drops us below 2, re-show Now
      const nextHideNow = remaining.length >= 2 ? hideNow : false;
      if (remaining.length > 0) {
        const path = `${localePath}${buildShareablePath(remaining)}`;
        router.push(buildUrl(path, title, nextHideNow));
      } else {
        router.push(buildUrl(`${localePath}/`, title, false));
      }
    },
    [selected, router, title, hideNow, localePath]
  );

  const handleShowNow = useCallback(() => {
    setHideNow(false);
    const path = selected.length > 0 ? `${localePath}${buildShareablePath(selected)}` : `${localePath}/`;
    window.history.replaceState(null, "", buildUrl(path, title, false));
  }, [selected, title, localePath]);

  // Recompute client-side when format differs from default
  const needsClientCompute = timespanFormat !== 2;

  const nowLabel = tCommon("now");
  const spanT = useCallback(
    (key: string, values?: Record<string, string | number>) => tDate(key, values),
    [tDate]
  );

  const { timeline, href } = useMemo(() => {
    let tl: { markers: MarkerData[]; segments: SegmentData[] };
    let h: string;

    if (needsClientCompute && selected.length > 0) {
      const result = computeTimeline(selected, timespanFormat, locale, nowLabel, spanT);
      tl = { markers: result.markers, segments: result.segments };
      h = buildShareablePath(selected);
    } else {
      tl = serverTimeline || { markers: [], segments: [] };
      h = serverHref || "/";
    }

    // Strip Now marker + last segment when hidden and 2+ events
    if (hideNow && selected.length >= 2 && tl.markers.length > 0) {
      const lastMarker = tl.markers[tl.markers.length - 1];
      if (lastMarker.event.id === "0") {
        tl = {
          markers: tl.markers.slice(0, -1),
          segments: tl.segments.slice(0, -1),
        };
      }
    }

    return { timeline: tl, href: h };
  }, [needsClientCompute, selected, timespanFormat, serverTimeline, serverHref, hideNow, locale, nowLabel, spanT]);

  // Allow removing Now when there are 2+ events (timeline still has 2 markers without it)
  const canRemoveNow = selected.length >= 2;

  const shareHref = buildUrl(`${localePath}${href}`, title, hideNow);

  const [zoomed, setZoomed] = useState(false);
  const { exportRef, handleExport } = useExport(selected);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isMobile = window.innerWidth <= 640;
    if (isMobile) {
      const atStart = el.scrollTop <= 2;
      const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
      setScrollPos(atStart ? "start" : atEnd ? "end" : "middle");
    } else {
      const atStart = el.scrollLeft <= 2;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
      setScrollPos(atStart ? "start" : atEnd ? "end" : "middle");
    }
  }, []);

  useEffect(() => {
    setScrollPos("start");
  }, [zoomed]);

  // Global "/" shortcut to focus search input
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "/" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>(
          `.${styles.chooser} input:not(:disabled)`
        );
        input?.focus();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <>
      <div className={styles.chooser}>
        <div className={styles.headingRow}>
          <p className={styles.heading}>{t("heading")}</p>
        </div>
        <EventAutocomplete
          selectedKeys={currentKeys}
          onSelect={handleSelect}
          isLoadingRandom={loadingRandom}
          onRandom={handleRandom}
        />
      </div>
      <div ref={exportRef} className={styles.exportArea} aria-live="polite" aria-atomic="true">
        {selected.length > 0 && (
          <>
            <EditableTitle ref={titleRef} value={title} onChange={handleTitleChange} />
            <ShareToolbar
              href={shareHref}
              title={title}
              onExport={timeline.markers.length >= 2 ? handleExport : undefined}
              showNowButton={hideNow && selected.length >= 2}
              onShowNow={handleShowNow}
              zoomed={zoomed}
              onToggleZoom={() => setZoomed((z) => !z)}
              showEditTitle={!title}
              onEditTitle={() => titleRef.current?.focus()}
            />
          </>
        )}
        <div ref={scrollRef} className={zoomed ? `${styles.timelineScroll}${scrollPos !== "start" ? ` ${styles[scrollPos === "end" ? "scrolledEnd" : "scrolledMiddle"]}` : ""}` : undefined} onScroll={zoomed ? handleScroll : undefined}>
          <Timeline
            markers={timeline.markers}
            segments={timeline.segments}
            onRemove={handleRemove}
            onToggleDeath={handleToggleDeath}
            canRemoveNow={canRemoveNow}
            zoomed={zoomed}
          />
        </div>
        <div className={styles.watermark} data-show-on-export>
          wiki:closerintime
        </div>
      </div>
    </>
  );
}
