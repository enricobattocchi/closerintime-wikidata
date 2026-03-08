"use client";

import { useEffect, useRef } from "react";
import {
  AccountBalance, MusicNote, Movie, Domain, MenuBook,
  ScienceIcon, PaletteIcon, MemoryIcon, SportsSoccer,
  LiveTv, AccountCircle,
} from "@/components/Icon";
import styles from "@/styles/HelpModal.module.css";

interface HelpModalProps {
  onClose: () => void;
}

const categories = [
  { icon: AccountBalance, label: "history" },
  { icon: MusicNote, label: "music" },
  { icon: MemoryIcon, label: "computer" },
  { icon: PaletteIcon, label: "art" },
  { icon: Movie, label: "film" },
  { icon: Domain, label: "building" },
  { icon: ScienceIcon, label: "science" },
  { icon: MenuBook, label: "book" },
  { icon: SportsSoccer, label: "sport" },
  { icon: LiveTv, label: "pop culture" },
  { icon: AccountCircle, label: "personal" },
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
            Visualize the time between historical events.
          </p>
          <p>
            Pick up to three events by typing in the search fields. You can
            search by name, year, or category:
          </p>
          <ul className={styles.categories}>
            {categories.map(({ icon: Icon, label }) => (
              <li key={label} className={styles.category}>
                <Icon size={20} className={styles.categoryIcon} />
                {label}
              </li>
            ))}
          </ul>
          <p>
            After you&apos;ve chosen your events, the timeline will update to
            show the proportional timespans between them and now.
          </p>
          <p>
            You can add your own personal events (e.g. your birthday) using the{" "}
            <strong>+</strong> button. They are stored locally in your browser
            and not shared with anyone.
          </p>
          <p>
            The dates chosen for some events may be approximate when precise
            dating is not possible. Click an event on the timeline to read its
            Wikipedia article and learn more.
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
