"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Event } from "@/lib/types";
import { useWikidataSearch } from "@/hooks/useWikidataSearch";
import { formatYear } from "@/lib/date-utils";
import CategoryIcon from "@/components/CategoryIcon";
import { SearchIcon, CloseIcon, DiceIcon } from "@/components/Icon";
import styles from "@/styles/Chooser.module.css";

interface EventAutocompleteProps {
  selectedIds: string[];
  value: Event | null;
  onSelect: (event: Event) => void;
  onClear: () => void;
  isLoadingRandom?: boolean;
  onRandom?: () => void;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function EventAutocomplete({
  selectedIds,
  value,
  onSelect,
  onClear,
  isLoadingRandom,
  onRandom,
}: EventAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { results, isLoading } = useWikidataSearch(query);

  // Filter out already-selected events
  const filtered = results.filter((e) => !selectedIds.includes(e.id));

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset highlight when results change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [results]);

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
          aria-label={`Selected event: ${capitalize(value.name)}`}
        />
        {value.link && (
          <a
            href={value.link}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.linkButton}
            aria-label={`Wikipedia article about ${capitalize(value.name)}`}
            title={`Wikipedia: ${capitalize(value.name)}`}
          >
            <img src="/icons/wikipedia-w.svg" alt="Wikipedia" width={18} height={18} />
          </a>
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

  const showDropdown = isOpen && query.trim().length >= 2;

  return (
    <div
      className={styles.slot}
      ref={wrapperRef}
      onBlur={(e) => {
        if (!wrapperRef.current?.contains(e.relatedTarget as Node)) {
          setIsOpen(false);
        }
      }}
    >
      <div className={styles.inputWrapper}>
        <span className={styles.selectedIcon}>
          <SearchIcon size={20} />
        </span>
        <div className={styles.inputInner}>
          <input
            ref={inputRef}
            className={`${styles.input}${query ? ` ${styles.inputWithClear}` : ""}`}
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
          {query && (
            <button
              className={styles.clearButton}
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              title="Clear search"
            >
              <CloseIcon size={16} />
            </button>
          )}
          {showDropdown && (
            <div className={styles.dropdown}>
              <div role="listbox" id={listboxId} ref={listRef}>
                {isLoading ? (
                  <div className={styles.noResults}>Searching Wikidata…</div>
                ) : filtered.length === 0 ? (
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
                      <span className={styles.optionName}>
                        {capitalize(event.name)}
                        {event.description && (
                          <span className={styles.optionDesc}>{event.description}</span>
                        )}
                      </span>
                      <span className={styles.optionYear}>
                        {formatYear(event.year)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        {onRandom && (
          <button
            className={styles.randomButton}
            onClick={onRandom}
            disabled={isLoadingRandom}
            aria-label="Random event"
            title="Random event"
          >
            <DiceIcon size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
