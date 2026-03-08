"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { Event, MarkerData, SegmentData } from "@/lib/types";
import { useLocalEvents } from "@/hooks/useLocalEvents";
import { useCachedEvents } from "@/hooks/useCachedEvents";
import { useSettings } from "@/hooks/useSettings";
import { useExport } from "@/hooks/useExport";
import { computeTimeline } from "@/lib/timeline-math";
import { generateSentence } from "@/lib/sentence";
import { buildShareablePath } from "@/lib/custom-event-url";
import EventAutocomplete from "./EventAutocomplete";
import Timeline from "@/components/Timeline/Timeline";

const AddEventForm = dynamic(() => import("./AddEventForm"));
import Sentence from "@/components/Sentence";
import { HelpOutline, SettingsOutlined } from "@/components/Icon";
import styles from "@/styles/Chooser.module.css";

const HelpModal = dynamic(() => import("@/components/HelpModal"));
const SettingsModal = dynamic(() => import("@/components/SettingsModal"));

interface ChooserProps {
  allEvents: Event[];
  selectedEvents: Event[];
  /** Custom events decoded from the URL (for sharing) */
  urlCustomEvents?: Event[];
  /** Server-computed data, used when no local events are selected and format=0 */
  serverTimeline?: { markers: MarkerData[]; segments: SegmentData[] };
  serverSentence?: string;
  serverHref?: string;
}

export default function Chooser({
  allEvents,
  selectedEvents,
  urlCustomEvents = [],
  serverTimeline,
  serverSentence,
  serverHref,
}: ChooserProps) {
  const router = useRouter();
  const cachedEvents = useCachedEvents(allEvents);
  const { localEvents, addEvent, deleteEvent: deleteLocalEvent } = useLocalEvents();
  const { timespanFormat, updateTimespanFormat, theme, updateTheme } = useSettings();
  const [selectedLocalEvents, setSelectedLocalEvents] = useState<Event[]>(urlCustomEvents);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Merge server + local events for the search list
  const mergedEvents = useMemo(
    () => [...cachedEvents, ...localEvents],
    [cachedEvents, localEvents]
  );

  // All currently selected events = server-selected + client-selected local events
  const allSelected = useMemo(
    () => [...selectedEvents, ...selectedLocalEvents],
    [selectedEvents, selectedLocalEvents]
  );

  const currentIds = allSelected.map((e) => e.id);

  const navigate = useCallback(
    (serverEvts: Event[], customEvts: Event[]) => {
      const path = buildShareablePath(serverEvts, customEvts);
      router.push(path);
    },
    [router]
  );

  const handleSelect = useCallback(
    (slotIndex: number, event: Event) => {
      if (event.id < 0) {
        const nextCustom = [...selectedLocalEvents, event];
        setSelectedLocalEvents(nextCustom);
        navigate(selectedEvents, nextCustom);
      } else {
        const serverEvts = [...selectedEvents, event];
        navigate(serverEvts, selectedLocalEvents);
      }
    },
    [selectedEvents, selectedLocalEvents, navigate]
  );

  const handleClear = useCallback(
    (slotIndex: number) => {
      const event = allSelected[slotIndex];
      if (!event) return;

      if (event.id < 0) {
        const remainingCustom = selectedLocalEvents.filter((e) => e.id !== event.id);
        setSelectedLocalEvents(remainingCustom);
        if (selectedEvents.length > 0 || remainingCustom.length > 0) {
          navigate(selectedEvents, remainingCustom);
        } else {
          router.push("/");
        }
      } else {
        const remainingServer = selectedEvents.filter((e) => e.id !== event.id);
        if (remainingServer.length > 0 || selectedLocalEvents.length > 0) {
          navigate(remainingServer, selectedLocalEvents);
        } else {
          router.push("/");
        }
      }
    },
    [allSelected, selectedEvents, selectedLocalEvents, navigate, router]
  );

  // Recompute client-side when local events are selected OR settings differ from default
  const hasLocalSelection = selectedLocalEvents.length > 0;
  const needsClientCompute = hasLocalSelection || timespanFormat !== 2;

  let timeline: { markers: MarkerData[]; segments: SegmentData[] };
  let sentence: string;
  let href: string;

  if (needsClientCompute && allSelected.length > 0) {
    const result = computeTimeline(allSelected, timespanFormat);
    timeline = { markers: result.markers, segments: result.segments };
    sentence = generateSentence(allSelected, timespanFormat);
    // Shareable URL includes both server events and custom events
    href = buildShareablePath(selectedEvents, selectedLocalEvents);
  } else {
    timeline = serverTimeline || { markers: [], segments: [] };
    sentence = serverSentence || "";
    href = serverHref || "/";
  }

  // Build slots: filled + one empty if < 3
  const slots: (Event | null)[] = [...allSelected];
  if (slots.length < 3) {
    slots.push(null);
  }

  const isLocalEvent = (event: Event | null) => event !== null && event.id < 0;

  const { exportRef, handleExport } = useExport(allSelected);

  // Global "/" shortcut to focus first empty search input
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
          <p className={styles.heading}>Pick some events or <a href="/browse" className={styles.browseLink}>browse</a></p>
          <button
            className={styles.iconButton}
            onClick={() => setShowHelp(true)}
            aria-label="Help"
            title="Help"
          >
            <HelpOutline size={20} />
          </button>
          <button
            className={styles.iconButton}
            onClick={() => setShowSettings(true)}
            aria-label="Settings"
            title="Settings"
          >
            <SettingsOutlined size={20} />
          </button>
        </div>
        {slots.map((event, i) => (
          <div key={event ? event.id : `empty-${i}`} className={styles.slot}>
            <EventAutocomplete
              events={mergedEvents}
              selectedIds={currentIds}
              value={event}
              onSelect={(e) => handleSelect(i, e)}
              onClear={() => handleClear(i)}
              isLocal={isLocalEvent(event)}
              onDelete={
                isLocalEvent(event)
                  ? () => {
                      if (!confirm(`Delete "${event!.name}"?`)) return;
                      const dbId = -(event!.id);
                      deleteLocalEvent(dbId);
                      const remainingCustom = selectedLocalEvents.filter(
                        (e) => e.id !== event!.id
                      );
                      setSelectedLocalEvents(remainingCustom);
                      if (selectedEvents.length > 0 || remainingCustom.length > 0) {
                        navigate(selectedEvents, remainingCustom);
                      } else {
                        router.push("/");
                      }
                    }
                  : undefined
              }
              onAdd={!event ? () => setShowAddForm(!showAddForm) : undefined}
              showingAddForm={!event ? showAddForm : false}
            />
          </div>
        ))}
        {showAddForm && (
          <AddEventForm
            onSave={async (event) => {
              const dbId = await addEvent(event);
              setShowAddForm(false);
              // Auto-select the new event
              setSelectedLocalEvents((prev) => [
                ...prev,
                {
                  id: -dbId,
                  name: event.name,
                  year: event.year,
                  month: event.month,
                  day: event.day,
                  type: event.type,
                  enabled: 1,
                  plural: event.plural,
                  link: event.link,
                },
              ]);
            }}
            onCancel={() => setShowAddForm(false)}
          />
        )}
      </div>
      <div ref={exportRef} className={styles.exportArea} aria-live="polite" aria-atomic="true">
        {allSelected.length > 0 && (
          <Sentence
            text={sentence}
            href={href}
            onExport={timeline.markers.length >= 2 ? handleExport : undefined}
          />
        )}
        <Timeline markers={timeline.markers} segments={timeline.segments} />
      </div>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showSettings && (
        <SettingsModal
          timespanFormat={timespanFormat}
          onSave={updateTimespanFormat}
          theme={theme}
          onThemeChange={updateTheme}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
}
