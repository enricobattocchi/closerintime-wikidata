"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useSettings } from "@/hooks/useSettings";
import { HelpOutline, SettingsOutlined } from "@/components/Icon";
import styles from "@/styles/Footer.module.css";

const HelpModal = dynamic(() => import("@/components/HelpModal"));
const SettingsModal = dynamic(() => import("@/components/SettingsModal"));

export default function Footer() {
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { timespanFormat, updateTimespanFormat, theme, updateTheme } = useSettings();

  return (
    <>
      <footer className={styles.footer}>
        <div className={styles.actions}>
          <button
            className={styles.iconButton}
            onClick={() => setShowHelp(true)}
            aria-label="Help"
            title="Help"
          >
            <HelpOutline size={18} />
          </button>
          <button
            className={styles.iconButton}
            onClick={() => setShowSettings(true)}
            aria-label="Settings"
            title="Settings"
          >
            <SettingsOutlined size={18} />
          </button>
        </div>
        <p className={styles.credit}>
          A progressive web app from{" "}
          <a href="https://lopo.it" rel="author noopener" target="_blank">
            Lopo.it
          </a>
          {" "}&middot;{" "}
          <a href="https://github.com/enricobattocchi/closerintime-wikidata" rel="noopener" target="_blank">
            GitHub
          </a>
          {" "}&middot;{" "}
          Check also{" "}
          <a href="https://closerinti.me" rel="noopener" target="_blank">
            #closerintime
          </a>
        </p>
      </footer>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showSettings && (
        <SettingsModal
          timespanFormat={timespanFormat}
          onSave={updateTimespanFormat}
          theme={theme}
          onThemeChange={updateTheme}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
}
