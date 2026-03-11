"use client";

import { useEffect, useRef } from "react";
import {
  AccountBalance, MusicNote, Movie, Domain, MenuBook,
  ScienceIcon, PaletteIcon, MemoryIcon, SportsSoccer,
  LiveTv, PersonIcon, PlaceIcon, GroupIcon, WarningIcon,
  MilitaryIcon, FlightIcon,
} from "@/components/Icon";
import styles from "@/styles/HelpModal.module.css";

interface HelpModalProps {
  onClose: () => void;
}

const categories = [
  { icon: PersonIcon, label: "person" },
  { icon: AccountBalance, label: "history" },
  { icon: MusicNote, label: "music" },
  { icon: ScienceIcon, label: "science" },
  { icon: PaletteIcon, label: "art" },
  { icon: Movie, label: "film" },
  { icon: MenuBook, label: "book" },
  { icon: Domain, label: "building" },
  { icon: MemoryIcon, label: "computer" },
  { icon: SportsSoccer, label: "sport" },
  { icon: LiveTv, label: "pop culture" },
  { icon: MilitaryIcon, label: "military" },
  { icon: PlaceIcon, label: "place" },
  { icon: GroupIcon, label: "organization" },
  { icon: WarningIcon, label: "disaster" },
  { icon: FlightIcon, label: "transport" },
];

export default function HelpModal({ onClose }: HelpModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

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
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        ref={modalRef}
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        tabIndex={-1}
      >
        <div className={styles.header}>
          <h3 id="help-title" className={styles.title}>How it works</h3>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className={styles.body}>
          <p className={styles.description}>
            Visualize the time between historical events, powered by{" "}
            <a href="https://www.wikidata.org" target="_blank" rel="noopener">Wikidata</a>.
          </p>
          <p>
            Search for any number of events by typing in the search field.
            Results come directly from Wikidata&apos;s knowledge base of
            millions of entities &mdash; people, places, inventions, battles,
            and more. For people, you can choose between birth and death dates.
          </p>
          <p>Events are classified into categories:</p>
          <ul className={styles.categories}>
            {categories.map(({ icon: Icon, label }) => (
              <li key={label} className={styles.category}>
                <Icon size={20} className={styles.categoryIcon} />
                {label}
              </li>
            ))}
          </ul>
          <p>
            The timeline shows proportional timespans between your events and
            now. You can hide the &ldquo;Now&rdquo; marker, give your timeline
            a custom title via the pencil icon, and zoom in when markers are
            crowded.
          </p>
          <p>
            Dates are sourced from Wikidata and may be approximate when precise
            dating is not possible. Click an event on the timeline to read its
            Wikipedia article.
          </p>
          <p>
            Share your timeline by copying the URL or download it as a PNG
            image. Each combination of events has a unique, shareable link.
          </p>
        </div>
        <div className={styles.footer}>
          <button className={styles.closeBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
