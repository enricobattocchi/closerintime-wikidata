"use client";

import { useState, useCallback, useEffect } from "react";
import { ContentCopy, DownloadIcon, ShareIcon } from "@/components/Icon";
import styles from "@/styles/Sentence.module.css";

interface SentenceProps {
  text: string;
  href: string;
  onExport?: () => void;
}

export default function Sentence({ text, href, onExport }: SentenceProps) {
  const [showToast, setShowToast] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator.share === "function");
  }, []);

  const handleCopy = useCallback(async () => {
    const url = window.location.origin + href;
    await navigator.clipboard.writeText(url);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  }, [href]);

  const handleShare = useCallback(async () => {
    const url = window.location.origin + href;
    try {
      await navigator.share({ title: text, url });
    } catch {
      // User cancelled or share failed — ignore
    }
  }, [text, href]);

  if (!text) return null;

  return (
    <div className={styles.container}>
      <a href={href} className={styles.sentence}>
        {text}
      </a>
      <div className={styles.iconGroup}>
        <button
          className={styles.copyButton}
          onClick={handleCopy}
          aria-label="Copy link"
          title="Copy link"
          data-hide-on-export
        >
          <ContentCopy size={18} />
        </button>
        {canShare && (
          <button
            className={styles.copyButton}
            onClick={handleShare}
            aria-label="Share"
            title="Share"
            data-hide-on-export
          >
            <ShareIcon size={18} />
          </button>
        )}
        {onExport && (
          <button
            className={styles.copyButton}
            onClick={onExport}
            aria-label="Download as image"
            title="Download as image"
            data-hide-on-export
          >
            <DownloadIcon size={18} />
          </button>
        )}
      </div>
      {showToast && <div className={styles.toast} role="status" aria-live="polite">Link copied!</div>}
    </div>
  );
}
