"use client";

import { useState, useEffect } from "react";
import type { Event } from "@/lib/types";

type DexieTable = {
  bulkPut(items: Event[]): Promise<void>;
  toArray(): Promise<Event[]>;
};

let cacheDbPromise: Promise<{ cachedEvents: DexieTable }> | null = null;

function getCacheDb(): Promise<{ cachedEvents: DexieTable }> {
  if (!cacheDbPromise) {
    cacheDbPromise = import("dexie").then(({ default: Dexie }) => {
      const db = new Dexie("closerintime-cache") as typeof Dexie.prototype & {
        cachedEvents: DexieTable;
      };
      db.version(1).stores({
        cachedEvents: "id",
      });
      return db as unknown as { cachedEvents: DexieTable };
    });
  }
  return cacheDbPromise;
}

export function useCachedEvents(serverEvents: Event[]): Event[] {
  const [events, setEvents] = useState(serverEvents);

  useEffect(() => {
    if (serverEvents.length > 0) {
      // Cache the server events (non-blocking)
      getCacheDb()
        .then((db) => db.cachedEvents.bulkPut(serverEvents))
        .catch(() => {});
      setEvents(serverEvents);
    } else {
      // Offline — try to load from cache
      getCacheDb()
        .then((db) => db.cachedEvents.toArray())
        .then((cached) => {
          if (cached.length > 0) setEvents(cached);
        })
        .catch(() => {});
    }
  }, [serverEvents]);

  return events;
}
