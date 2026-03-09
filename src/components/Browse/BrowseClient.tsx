"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Event } from "@/lib/types";
import { EVENT_TYPES } from "@/lib/types";
import { formatYear } from "@/lib/date-utils";
import { ERAS, groupByEra } from "@/lib/eras";
import { getCacheDb } from "@/lib/cache-db";
import CategoryIcon from "@/components/CategoryIcon";
import styles from "@/styles/Browse.module.css";

interface EraData {
  id: string;
  label: string;
  description: string;
  events: Event[];
}

interface BrowseClientProps {
  eras: EraData[];
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildErasFromEvents(events: Event[]): EraData[] {
  const groups = groupByEra(events);
  return ERAS.map((era) => ({
    id: era.id,
    label: era.label,
    description: era.description,
    events: groups.get(era.id) || [],
  }));
}

export default function BrowseClient({ eras: serverEras }: BrowseClientProps) {
  const router = useRouter();
  const [eras, setEras] = useState(serverEras);
  const [isOffline, setIsOffline] = useState(false);

  // Track offline state
  useEffect(() => {
    if (!navigator.onLine) setIsOffline(true);
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  // Fall back to cached events when server returned nothing (offline)
  useEffect(() => {
    const hasEvents = serverEras.some((e) => e.events.length > 0);
    if (!hasEvents) {
      getCacheDb()
        .then((db) => db.cachedEvents.toArray())
        .then((cached) => {
          if (cached.length > 0) {
            setEras(buildErasFromEvents(cached));
          }
        })
        .catch(() => {});
    }
  }, [serverEras]);

  // When offline, store event ID and navigate to cached home page
  const handleEventClick = useCallback(
    (e: React.MouseEvent, eventId: number) => {
      if (!isOffline) return; // let normal Link navigation proceed
      e.preventDefault();
      sessionStorage.setItem("pendingEventId", String(eventId));
      window.location.href = "/";
    },
    [isOffline]
  );

  const [openEras, setOpenEras] = useState<Set<string>>(() => new Set());
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const allEvents = useMemo(() => eras.flatMap((e) => e.events), [eras]);

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of allEvents) {
      map.set(e.type, (map.get(e.type) || 0) + 1);
    }
    return map;
  }, [allEvents]);

  const filteredEras = useMemo(() => {
    if (!categoryFilter) return eras;
    return eras.map((era) => ({
      ...era,
      events: era.events.filter((e) => e.type === categoryFilter),
    }));
  }, [eras, categoryFilter]);

  const totalFiltered = filteredEras.reduce((sum, e) => sum + e.events.length, 0);

  const toggle = (id: string) => {
    setOpenEras((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Browse by era</h1>
      <p className={styles.subtitle}>
        {categoryFilter
          ? `${totalFiltered} ${categoryFilter} events across history.`
          : `Explore ${totalFiltered} events across history.`}
        {" "}Click an event to add it to your timeline.
      </p>
      <div className={styles.chips}>
        {EVENT_TYPES.map((type) => (
          <button
            key={type}
            className={`${styles.chip}${categoryFilter === type ? ` ${styles.chipActive}` : ""}`}
            onClick={() => setCategoryFilter(categoryFilter === type ? null : type)}
            aria-pressed={categoryFilter === type}
            title={capitalize(type)}
          >
            <CategoryIcon type={type} size={16} />
            <span>{capitalize(type)} ({categoryCounts.get(type) || 0})</span>
          </button>
        ))}
      </div>
      <div className={styles.eras}>
        {filteredEras.map((era) => {
          if (era.events.length === 0) return null;
          const isOpen = openEras.has(era.id);
          return (
            <div key={era.id} className={styles.era}>
              <button
                className={styles.eraHeader}
                onClick={() => toggle(era.id)}
                aria-expanded={isOpen}
                aria-controls={`era-${era.id}`}
              >
                <div className={styles.eraInfo}>
                  <span className={styles.eraLabel}>{era.label}</span>
                  <span className={styles.eraDescription}>{era.description}</span>
                </div>
                <span className={styles.eraCount}>{era.events.length} events</span>
                <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`} aria-hidden="true">
                  &#9662;
                </span>
              </button>
              {isOpen && (
                <div id={`era-${era.id}`} className={styles.eventList} role="list" tabIndex={-1}>
                  {era.events.map((event) => (
                    <Link
                      key={event.id}
                      href={`/${event.id}`}
                      className={styles.eventItem}
                      role="listitem"
                      onClick={(e) => handleEventClick(e, event.id)}
                    >
                      <span className={styles.eventIcon}>
                        <CategoryIcon type={event.type} size={20} />
                      </span>
                      <span className={styles.eventName}>{capitalize(event.name)}</span>
                      <span className={styles.eventYear}>{formatYear(event.year)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className={styles.backLink}>
        <Link href="/">&#8592; Back to timeline</Link>
      </div>
    </div>
  );
}
