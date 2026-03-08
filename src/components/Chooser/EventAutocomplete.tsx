"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { Event } from "@/lib/types";
import { formatYear } from "@/lib/date-utils";
import CategoryIcon from "@/components/CategoryIcon";
import { SearchIcon, AddCircleOutline, CloseIcon, DeleteIcon } from "@/components/Icon";
import styles from "@/styles/Chooser.module.css";

interface EventAutocompleteProps {
  events: Event[];
  selectedIds: number[];
  value: Event | null;
  onSelect: (event: Event) => void;
  onClear: () => void;
  isLocal?: boolean;
  onDelete?: () => void;
  onAdd?: () => void;
  showingAddForm?: boolean;
}

function tokenize(s: string): string[] {
  return s.toLowerCase().split(/\s+/).filter(Boolean);
}

function matchesQuery(event: Event, query: string): boolean {
  const tokens = tokenize(query);
  const searchable = `${event.name} ${event.year} ${event.type}`.toLowerCase();
  return tokens.every((t) => searchable.includes(t));
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getRandomEvents(events: Event[], count: number): Event[] {
  const copy = [...events];
  const result: Event[] = [];
  for (let i = 0; i < count && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

export default function EventAutocomplete({
  events,
  selectedIds,
  value,
  onSelect,
  onClear,
  isLocal,
  onDelete,
  onAdd,
  showingAddForm,
}: EventAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [randomEvents] = useState(() => getRandomEvents(events, 10));
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const available = useMemo(
    () => events.filter((e) => !selectedIds.includes(e.id)),
    [events, selectedIds]
  );
  const filtered = useMemo(
    () => query
      ? available.filter((e) => matchesQuery(e, query)).slice(0, 10)
      : randomEvents.filter((e) => !selectedIds.includes(e.id)).slice(0, 10),
    [available, query, randomEvents, selectedIds]
  );

  // Reset highlight when query or filtered list changes
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          setIsOpen(true);
          e.preventDefault();
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filtered.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : filtered.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
            onSelect(filtered[highlightedIndex]);
            setQuery("");
            setIsOpen(false);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
      }
    },
    [isOpen, filtered, highlightedIndex, onSelect]
  );

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const el = listRef.current.children[highlightedIndex] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  if (value) {
    return (
      <div className={styles.inputWrapper}>
        <span className={styles.selectedIcon}>
          <CategoryIcon type={value.type} size={20} />
        </span>
        <input
          className={styles.input}
          disabled
          value={`${capitalize(value.name)} \u2013 ${formatYear(value.year)}`}
        />
        {value.link && (
          <a
            href={value.link}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.linkButton}
            aria-label="Wikipedia article"
            title="Wikipedia article"
          >
            <img src="/icons/wikipedia-w.svg" alt="Wikipedia" width={18} height={18} />
          </a>
        )}
        {isLocal && onDelete && (
          <button
            className={styles.deleteButton}
            onClick={onDelete}
            aria-label="Delete local event"
            title="Delete this local event"
          >
            <DeleteIcon size={18} />
          </button>
        )}
        <button className={styles.cancelButton} onClick={onClear} aria-label="Remove event">
          <CloseIcon size={18} />
        </button>
      </div>
    );
  }

  const listboxId = "autocomplete-listbox";
  const activeDescendant =
    highlightedIndex >= 0 && filtered[highlightedIndex]
      ? `option-${filtered[highlightedIndex].id}`
      : undefined;

  return (
    <div className={styles.slot} ref={wrapperRef}>
      <div className={styles.inputWrapper}>
        <span className={styles.selectedIcon}>
          <SearchIcon size={20} />
        </span>
        <input
          ref={inputRef}
          className={styles.input}
          placeholder="Search for an event..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={activeDescendant}
          aria-autocomplete="list"
        />
        {onAdd && (
          <button
            className={styles.addIconButton}
            onClick={onAdd}
            aria-label={showingAddForm ? "Cancel adding event" : "Add your own event"}
            title={showingAddForm ? "Cancel" : "Add your own event"}
          >
            {showingAddForm ? <CloseIcon size={20} /> : <AddCircleOutline size={20} />}
          </button>
        )}
      </div>
      {isOpen && (
        <div className={styles.dropdown} role="listbox" id={listboxId} ref={listRef}>
          {filtered.length === 0 ? (
            <div className={styles.noResults}>No events found</div>
          ) : (
            filtered.map((event, index) => (
              <div
                key={event.id}
                id={`option-${event.id}`}
                role="option"
                aria-selected={index === highlightedIndex}
                className={`${styles.option}${index === highlightedIndex ? ` ${styles.optionHighlighted}` : ""}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(event);
                  setQuery("");
                  setIsOpen(false);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span className={styles.optionIcon}>
                  <CategoryIcon type={event.type} size={20} />
                </span>
                <span className={styles.optionName}>{capitalize(event.name)}</span>
                <span className={styles.optionYear}>
                  {formatYear(event.year)}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
