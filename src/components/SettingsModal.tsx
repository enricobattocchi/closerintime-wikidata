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

  const hasChanges = format !== timespanFormat || selectedTheme !== theme;

  const handleSave = () => {
    if (format !== timespanFormat) onSave(format);
    if (selectedTheme !== theme) onThemeChange(selectedTheme);
    onClose();
  };

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
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
        aria-labelledby="settings-title"
        tabIndex={-1}
      >
        <div className={styles.header}>
          <h3 id="settings-title" className={styles.title}>Settings</h3>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Theme</legend>
          <div className={styles.segmented}>
            <label>
              <input
                type="radio"
                name="theme"
                checked={selectedTheme === "system"}
                onChange={() => setSelectedTheme("system")}
              />
              <span>System</span>
            </label>
            <label>
              <input
                type="radio"
                name="theme"
                checked={selectedTheme === "light"}
                onChange={() => setSelectedTheme("light")}
              />
              <span>Light</span>
            </label>
            <label>
              <input
                type="radio"
                name="theme"
                checked={selectedTheme === "dark"}
                onChange={() => setSelectedTheme("dark")}
              />
              <span>Dark</span>
            </label>
          </div>
        </fieldset>
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Timespan format</legend>
          <div className={styles.optionList}>
            <label>
              <input
                type="radio"
                name="format"
                checked={format === 0}
                onChange={() => setFormat(0)}
              />
              <span>Days</span>
            </label>
            <label>
              <input
                type="radio"
                name="format"
                checked={format === 1}
                onChange={() => setFormat(1)}
              />
              <span>Years only</span>
            </label>
            <label>
              <input
                type="radio"
                name="format"
                checked={format === 2}
                onChange={() => setFormat(2)}
              />
              <span>Precise (years, months, days)</span>
            </label>
          </div>
        </fieldset>
        <button
          className={styles.saveButton}
          onClick={handleSave}
          disabled={!hasChanges}
        >
          Save
        </button>
      </div>
    </div>
  );
}
