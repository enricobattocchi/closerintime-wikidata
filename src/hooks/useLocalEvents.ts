"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface LocalEvent {
  id?: number;
  name: string;
  year: number;
  month: number | null;
  day: number | null;
  type: string;
  plural: number;
  link: string | null;
}

type DexieTable = {
  toArray(): Promise<LocalEvent[]>;
  add(event: Omit<LocalEvent, "id">): Promise<number>;
  update(id: number, changes: Partial<Omit<LocalEvent, "id">>): Promise<number>;
  delete(id: number): Promise<void>;
};

let dbPromise: Promise<{ localevents: DexieTable }> | null = null;

function getDb(): Promise<{ localevents: DexieTable }> {
  if (!dbPromise) {
    dbPromise = import("dexie").then(({ default: Dexie }) => {
      const db = new Dexie("closerintime-local") as typeof Dexie.prototype & {
        localevents: DexieTable;
      };
      db.version(1).stores({
        localevents: "++id, name, year",
      });
      return db as unknown as { localevents: DexieTable };
    });
  }
  return dbPromise;
}

export function useLocalEvents() {
  const [localEvents, setLocalEvents] = useState<LocalEvent[]>([]);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    const db = await getDb();
    const all = await db.localevents.toArray();
    if (mounted.current) setLocalEvents(all);
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh();
    return () => {
      mounted.current = false;
    };
  }, [refresh]);

  const addEvent = useCallback(
    async (event: Omit<LocalEvent, "id">) => {
      const db = await getDb();
      const dbId = await db.localevents.add(event);
      await refresh();
      return dbId as number;
    },
    [refresh]
  );

  const updateEvent = useCallback(
    async (id: number, changes: Omit<LocalEvent, "id">) => {
      const db = await getDb();
      await db.localevents.update(id, changes);
      await refresh();
    },
    [refresh]
  );

  const deleteEvent = useCallback(
    async (id: number) => {
      const db = await getDb();
      await db.localevents.delete(id);
      await refresh();
    },
    [refresh]
  );

  // Convert to Event interface with negative IDs
  const asEvents = localEvents.map((e) => ({
    id: -(e.id!),
    name: e.name,
    year: e.year,
    month: e.month,
    day: e.day,
    type: e.type,
    enabled: 1,
    plural: e.plural,
    link: e.link,
  }));

  return { localEvents: asEvents, addEvent, updateEvent, deleteEvent };
}
