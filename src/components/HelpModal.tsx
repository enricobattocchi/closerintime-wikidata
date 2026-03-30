"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
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

const categoryIcons = [
  { icon: PersonIcon, key: "person" },
  { icon: AccountBalance, key: "history" },
  { icon: MusicNote, key: "music" },
  { icon: ScienceIcon, key: "science" },
  { icon: PaletteIcon, key: "art" },
  { icon: Movie, key: "film" },
  { icon: MenuBook, key: "book" },
  { icon: Domain, key: "building" },
  { icon: MemoryIcon, key: "computer" },
  { icon: SportsSoccer, key: "sport" },
  { icon: LiveTv, key: "popCulture" },
  { icon: MilitaryIcon, key: "military" },
  { icon: PlaceIcon, key: "place" },
  { icon: GroupIcon, key: "organization" },
  { icon: WarningIcon, key: "disaster" },
  { icon: FlightIcon, key: "transport" },
] as const;

export default function HelpModal({ onClose }: HelpModalProps) {
  const t = useTranslations("help");
  const tCommon = useTranslations("common");
  const tCat = useTranslations("categories");
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
          <h3 id="help-title" className={styles.title}>{t("title")}</h3>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label={tCommon("close")}
          >
            &times;
          </button>
        </div>
        <div className={styles.body}>
          <p className={styles.description}>
            {t.rich("description", {
              wikidata: (chunks) => (
                <a href="https://www.wikidata.org" target="_blank" rel="noopener">{chunks}</a>
              ),
            })}
          </p>
          <p>{t("searchExplanation")}</p>
          <p>{t("categoriesLabel")}</p>
          <ul className={styles.categories}>
            {categoryIcons.map(({ icon: Icon, key }) => (
              <li key={key} className={styles.category}>
                <Icon size={20} className={styles.categoryIcon} />
                {tCat(key)}
              </li>
            ))}
          </ul>
          <p>{t("timelineExplanation")}</p>
          <p>{t("datesExplanation")}</p>
          <p>{t("shareExplanation")}</p>
        </div>
        <div className={styles.footer}>
          <button className={styles.closeBtn} onClick={onClose}>
            {tCommon("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
