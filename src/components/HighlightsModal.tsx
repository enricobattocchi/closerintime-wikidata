"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { Event } from "@/lib/types";
import { generateSentence } from "@/lib/sentence";
import styles from "@/styles/HighlightsModal.module.css";

interface HighlightsModalProps {
  onClose: () => void;
}

type PartialEvent = Pick<Event, "id" | "name" | "year" | "month" | "day" | "plural">;

const highlights: { path: string; events: PartialEvent[] }[] = [
  {
    path: "/90/322",
    events: [
      { id: 90, name: "the Great Pyramid of Giza", year: -2560, month: null, day: null, plural: 0 },
      { id: 322, name: "the foundation of G\u00f6bekli Tepe", year: -9600, month: null, day: null, plural: 0 },
    ],
  },
  {
    path: "/89/90",
    events: [
      { id: 89, name: "Cleopatra\u2019s death", year: -30, month: 8, day: 12, plural: 0 },
      { id: 90, name: "the Great Pyramid of Giza", year: -2560, month: null, day: null, plural: 0 },
    ],
  },
  {
    path: "/6/7/82",
    events: [
      { id: 6, name: "the Wright brothers\u2019 flight", year: 1903, month: 12, day: 17, plural: 0 },
      { id: 7, name: "the launch of the Sputnik 1", year: 1957, month: 10, day: 4, plural: 0 },
      { id: 82, name: "the first man on the Moon", year: 1969, month: 7, day: 21, plural: 0 },
    ],
  },
  {
    path: "/5/238",
    events: [
      { id: 5, name: "the Storming of the Bastille", year: 1789, month: 7, day: 14, plural: 0 },
      { id: 238, name: "the launch of Coca-Cola", year: 1886, month: 5, day: 8, plural: 0 },
    ],
  },
  {
    path: "/23/24",
    events: [
      { id: 23, name: "the setting of \u201CBack to the Future\u201D", year: 1955, month: 11, day: 5, plural: 0 },
      { id: 24, name: "the release of \u201CBack to the Future\u201D", year: 1985, month: null, day: null, plural: 0 },
    ],
  },
];

export default function HighlightsModal({ onClose }: HighlightsModalProps) {
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
        aria-labelledby="highlights-title"
        tabIndex={-1}
      >
        <div className={styles.header}>
          <h3 id="highlights-title" className={styles.title}>Did you know?</h3>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className={styles.body}>
          {highlights.map(({ path, events }) => (
            <Link
              key={path}
              href={path}
              className={styles.card}
              onClick={onClose}
            >
              {generateSentence(events as Event[])}
            </Link>
          ))}
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
