"use client";

import { useState, useEffect, useRef } from "react";
import type { TimespanFormat } from "@/lib/types";
import type { Theme } from "@/hooks/useSettings";
import styles from "@/styles/Settings.module.css";

interface SettingsModalProps {
  timespanFormat: TimespanFormat;
  onSave: (format: TimespanFormat) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onClose: () => void;
}

export default function SettingsModal({
  timespanFormat,
  onSave,
  theme,
  onThemeChange,
  onClose,
}: SettingsModalProps) {
  const [format, setFormat] = useState<TimespanFormat>(timespanFormat);
  const [selectedTheme, setSelectedTheme] = useState<Theme>(theme);
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
    // Focus the modal on open
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
        aria-labelledby="settings-title"
        tabIndex={-1}
      >
        <h3 id="settings-title" className={styles.title}>Settings</h3>
        <fieldset className={styles.fieldset}>
          <legend>Theme</legend>
          <label className={styles.radio}>
            <input
              type="radio"
              name="theme"
              checked={selectedTheme === "system"}
              onChange={() => setSelectedTheme("system")}
            />
            System
          </label>
          <label className={styles.radio}>
            <input
              type="radio"
              name="theme"
              checked={selectedTheme === "light"}
              onChange={() => setSelectedTheme("light")}
            />
            Light
          </label>
          <label className={styles.radio}>
            <input
              type="radio"
              name="theme"
              checked={selectedTheme === "dark"}
              onChange={() => setSelectedTheme("dark")}
            />
            Dark
          </label>
        </fieldset>
        <fieldset className={styles.fieldset}>
          <legend>Timespan format</legend>
          <label className={styles.radio}>
            <input
              type="radio"
              name="format"
              checked={format === 0}
              onChange={() => setFormat(0)}
            />
            Days
          </label>
          <label className={styles.radio}>
            <input
              type="radio"
              name="format"
              checked={format === 1}
              onChange={() => setFormat(1)}
            />
            Years only
          </label>
          <label className={styles.radio}>
            <input
              type="radio"
              name="format"
              checked={format === 2}
              onChange={() => setFormat(2)}
            />
            Precise (years, months, days)
          </label>
        </fieldset>
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            className={styles.saveBtn}
            onClick={() => {
              onSave(format);
              onThemeChange(selectedTheme);
              onClose();
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
