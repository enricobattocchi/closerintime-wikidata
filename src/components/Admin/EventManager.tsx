"use client";

import { useState, useEffect, useCallback } from "react";
import type { Event } from "@/lib/types";
import styles from "@/styles/Admin.module.css";

const EVENT_TYPES = [
  "art", "book", "building", "computer", "film",
  "history", "music", "pop culture", "science", "sport",
];

interface EventManagerProps {
  token: string;
}

export default function EventManager({ token }: EventManagerProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [edits, setEdits] = useState<Record<number, Partial<Event>>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/events", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setError("Failed to load events");
        return;
      }
      setEvents(await res.json());
    } catch {
      setError("Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const getEdited = (event: Event) => ({
    ...event,
    ...edits[event.id],
  });

  const setField = (id: number, field: string, value: string | number | null) => {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const hasEdits = (id: number) => {
    return edits[id] && Object.keys(edits[id]).length > 0;
  };

  const handleSave = async (id: number) => {
    const changes = edits[id];
    if (!changes) return;

    setSaving((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch("/api/admin/events", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, ...changes }),
      });
      if (res.ok) {
        const { event } = await res.json();
        setEvents((prev) => prev.map((e) => (e.id === id ? event : e)));
        setEdits((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    } finally {
      setSaving((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleDiscard = (id: number) => {
    setEdits((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}" permanently?`)) return;

    const res = await fetch("/api/admin/events", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setEvents((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const handleToggleEnabled = async (event: Event) => {
    const newEnabled = event.enabled === 1 ? 0 : 1;
    const res = await fetch("/api/admin/events", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id: event.id, enabled: newEnabled }),
    });
    if (res.ok) {
      setEvents((prev) =>
        prev.map((e) => (e.id === event.id ? { ...e, enabled: newEnabled } : e))
      );
    }
  };

  const filtered = events.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      e.type.toLowerCase().includes(q) ||
      String(e.year).includes(q)
    );
  });

  if (loading) return <p>Loading events...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div>
      <div className={styles.searchRow}>
        <input
          className={styles.searchInput}
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className={styles.eventCount}>{filtered.length} / {events.length}</span>
      </div>

      {filtered.map((event) => {
        const edited = getEdited(event);
        const modified = hasEdits(event.id);
        return (
          <div
            key={event.id}
            className={`${styles.card} ${event.enabled === 0 ? styles.disabled : ""}`}
          >
            <div className={styles.cardId}>#{event.id}</div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Name</label>
              <input
                className={styles.fieldInput}
                value={edited.name}
                onChange={(e) => setField(event.id, "name", e.target.value)}
              />
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Year</label>
                <div className={styles.yearRow}>
                  <input
                    className={styles.fieldInput}
                    type="number"
                    min="1"
                    value={Math.abs(edited.year)}
                    onChange={(e) => {
                      const abs = Math.abs(parseInt(e.target.value) || 1);
                      setField(event.id, "year", edited.year < 0 ? -abs : abs);
                    }}
                  />
                  <select
                    className={styles.eraSelect}
                    value={edited.year < 0 ? "BC" : "AD"}
                    onChange={(e) => {
                      const abs = Math.abs(edited.year);
                      setField(event.id, "year", e.target.value === "BC" ? -abs : abs);
                    }}
                  >
                    <option value="AD">A.D.</option>
                    <option value="BC">B.C.</option>
                  </select>
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Month</label>
                <input
                  className={styles.fieldInput}
                  type="number"
                  min="0"
                  max="12"
                  value={edited.month ?? ""}
                  onChange={(e) => setField(event.id, "month", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="--"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Day</label>
                <input
                  className={styles.fieldInput}
                  type="number"
                  min="0"
                  max="31"
                  value={edited.day ?? ""}
                  onChange={(e) => setField(event.id, "day", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="--"
                />
              </div>
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Type</label>
                <select
                  className={styles.fieldInput}
                  value={edited.type}
                  onChange={(e) => setField(event.id, "type", e.target.value)}
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Plural</label>
                <select
                  className={styles.fieldInput}
                  value={edited.plural}
                  onChange={(e) => setField(event.id, "plural", parseInt(e.target.value))}
                >
                  <option value={0}>no (is)</option>
                  <option value={1}>yes (are)</option>
                </select>
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Link</label>
              <input
                className={styles.fieldInput}
                value={edited.link ?? ""}
                onChange={(e) => setField(event.id, "link", e.target.value || null)}
              />
            </div>
            <div className={styles.cardActions}>
              <button
                className={styles.toggleBtn}
                onClick={() => handleToggleEnabled(event)}
              >
                {event.enabled === 1 ? "Disable" : "Enable"}
              </button>
              {modified && (
                <>
                  <button
                    className={styles.approveBtn}
                    onClick={() => handleSave(event.id)}
                    disabled={saving[event.id]}
                  >
                    {saving[event.id] ? "Saving..." : "Save"}
                  </button>
                  <button
                    className={styles.toggleBtn}
                    onClick={() => handleDiscard(event.id)}
                  >
                    Discard
                  </button>
                </>
              )}
              <button
                className={styles.rejectBtn}
                onClick={() => handleDelete(event.id, edited.name)}
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
