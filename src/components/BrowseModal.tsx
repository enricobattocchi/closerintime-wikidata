"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import type { Event } from "@/lib/types";
import { EVENT_TYPES } from "@/lib/types";
import { formatYear } from "@/lib/date-utils";
import { ERAS, groupByEra } from "@/lib/eras";
import CategoryIcon from "@/components/CategoryIcon";
import browseStyles from "@/styles/Browse.module.css";
import modalStyles from "@/styles/BrowseModal.module.css";

interface BrowseModalProps {
  events: Event[];
  selectedIds: number[];
  onSelect: (event: Event) => void;
  onClose: () => void;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function BrowseModal({ events, selectedIds, onSelect, onClose }: BrowseModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [openEras, setOpenEras] = useState<Set<string>>(() => new Set());
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const eras = useMemo(() => {
    const groups = groupByEra(events);
    return ERAS.map((era) => ({
      id: era.id,
      label: era.label,
      description: era.description,
      events: groups.get(era.id) || [],
    }));
  }, [events]);

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of events) {
      map.set(e.type, (map.get(e.type) || 0) + 1);
    }
    return map;
  }, [events]);

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

  // Focus trap + Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKey);
    modalRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className={modalStyles.overlay} onClick={onClose} role="presentation">
      <div
        ref={modalRef}
        className={modalStyles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="browse-title"
        tabIndex={-1}
      >
        <div className={modalStyles.header}>
          <h3 id="browse-title" className={modalStyles.title}>Browse by era</h3>
          <button
            className={modalStyles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <p className={browseStyles.subtitle}>
          {categoryFilter
            ? `${totalFiltered} ${categoryFilter} events.`
            : `${totalFiltered} events.`}
          {" "}Click to add to your timeline.
        </p>
        <div className={browseStyles.chips}>
          {EVENT_TYPES.map((type) => (
            <button
              key={type}
              className={`${browseStyles.chip}${categoryFilter === type ? ` ${browseStyles.chipActive}` : ""}`}
              onClick={() => setCategoryFilter(categoryFilter === type ? null : type)}
              aria-pressed={categoryFilter === type}
              title={capitalize(type)}
            >
              <CategoryIcon type={type} size={16} />
              <span>{capitalize(type)} ({categoryCounts.get(type) || 0})</span>
            </button>
          ))}
        </div>
        <div className={browseStyles.eras}>
          {filteredEras.map((era) => {
            if (era.events.length === 0) return null;
            const isOpen = openEras.has(era.id);
            return (
              <div key={era.id} className={browseStyles.era}>
                <button
                  className={browseStyles.eraHeader}
                  onClick={() => toggle(era.id)}
                  aria-expanded={isOpen}
                  aria-controls={`browse-era-${era.id}`}
                >
                  <div className={browseStyles.eraInfo}>
                    <span className={browseStyles.eraLabel}>{era.label}</span>
                    <span className={browseStyles.eraDescription}>{era.description}</span>
                  </div>
                  <span className={browseStyles.eraCount}>{era.events.length} events</span>
                  <span className={`${browseStyles.chevron} ${isOpen ? browseStyles.chevronOpen : ""}`} aria-hidden="true">
                    &#9662;
                  </span>
                </button>
                {isOpen && (
                  <div id={`browse-era-${era.id}`} className={browseStyles.eventList} role="list" tabIndex={-1}>
                    {era.events.map((event) => {
                      const alreadySelected = selectedIds.includes(event.id);
                      return (
                        <button
                          key={event.id}
                          className={`${browseStyles.eventItem} ${alreadySelected ? modalStyles.eventDisabled : ""}`}
                          role="listitem"
                          disabled={alreadySelected}
                          onClick={() => {
                            onSelect(event);
                            onClose();
                          }}
                        >
                          <span className={browseStyles.eventIcon}>
                            <CategoryIcon type={event.type} size={20} />
                          </span>
                          <span className={browseStyles.eventName}>{capitalize(event.name)}</span>
                          <span className={browseStyles.eventYear}>{formatYear(event.year)}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
