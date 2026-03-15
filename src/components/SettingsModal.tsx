"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import type { TimespanFormat } from "@/lib/types";
import type { Theme } from "@/hooks/useSettings";
import { locales, localeNames, type Locale } from "@/i18n/config";
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
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();
  const [format, setFormat] = useState<TimespanFormat>(timespanFormat);
  const [selectedTheme, setSelectedTheme] = useState<Theme>(theme);
  const [selectedLocale, setSelectedLocale] = useState<Locale>(currentLocale as Locale);
  const modalRef = useRef<HTMLDivElement>(null);

  const hasChanges = format !== timespanFormat || selectedTheme !== theme || selectedLocale !== currentLocale;

  const handleSave = () => {
    if (format !== timespanFormat) onSave(format);
    if (selectedTheme !== theme) onThemeChange(selectedTheme);
    if (selectedLocale !== currentLocale) {
      // Switch locale by navigating to the new locale path
      let newPath = pathname;
      // Remove current locale prefix if present
      for (const loc of locales) {
        if (pathname.startsWith(`/${loc}/`) || pathname === `/${loc}`) {
          newPath = pathname.slice(`/${loc}`.length) || "/";
          break;
        }
      }
      const target = `/${selectedLocale}${newPath}`;
      router.push(target);
    }
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
          <h3 id="settings-title" className={styles.title}>{t("title")}</h3>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label={tCommon("close")}
          >
            &times;
          </button>
        </div>
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>{t("theme")}</legend>
          <div className={styles.segmented}>
            <label>
              <input
                type="radio"
                name="theme"
                checked={selectedTheme === "system"}
                onChange={() => setSelectedTheme("system")}
              />
              <span>{t("themeSystem")}</span>
            </label>
            <label>
              <input
                type="radio"
                name="theme"
                checked={selectedTheme === "light"}
                onChange={() => setSelectedTheme("light")}
              />
              <span>{t("themeLight")}</span>
            </label>
            <label>
              <input
                type="radio"
                name="theme"
                checked={selectedTheme === "dark"}
                onChange={() => setSelectedTheme("dark")}
              />
              <span>{t("themeDark")}</span>
            </label>
          </div>
        </fieldset>
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>{t("timespanFormat")}</legend>
          <div className={styles.optionList}>
            <label>
              <input
                type="radio"
                name="format"
                checked={format === 0}
                onChange={() => setFormat(0)}
              />
              <span>{t("formatDays")}</span>
            </label>
            <label>
              <input
                type="radio"
                name="format"
                checked={format === 1}
                onChange={() => setFormat(1)}
              />
              <span>{t("formatYears")}</span>
            </label>
            <label>
              <input
                type="radio"
                name="format"
                checked={format === 2}
                onChange={() => setFormat(2)}
              />
              <span>{t("formatPrecise")}</span>
            </label>
          </div>
        </fieldset>
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>{t("language")}</legend>
          <div className={styles.optionList}>
            {locales.map((loc) => (
              <label key={loc}>
                <input
                  type="radio"
                  name="language"
                  checked={selectedLocale === loc}
                  onChange={() => setSelectedLocale(loc)}
                />
                <span>{localeNames[loc]}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <button
          className={styles.saveButton}
          onClick={handleSave}
          disabled={!hasChanges}
        >
          {tCommon("save")}
        </button>
      </div>
    </div>
  );
}
