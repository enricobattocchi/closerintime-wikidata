"use client";

import { useState, useCallback, useEffect } from "react";
import { ContentCopy, DownloadIcon, ShareIcon, EventAvailable, ZoomInIcon, ZoomOutIcon } from "@/components/Icon";
import styles from "@/styles/ShareToolbar.module.css";

interface ShareToolbarProps {
  href: string;
  title?: string;
  onExport?: () => void;
  showNowButton?: boolean;
  onShowNow?: () => void;
  zoomed?: boolean;
  onToggleZoom?: () => void;
}

export default function ShareToolbar({ href, title, onExport, showNowButton, onShowNow, zoomed, onToggleZoom }: ShareToolbarProps) {
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
      await navigator.share({ title: title || "Build your own timeline", url });
    } catch {
      // User cancelled or share failed — ignore
    }
  }, [title, href]);

  return (
    <div className={styles.container}>
      <div className={styles.iconGroup}>
        <button
          className={styles.button}
          onClick={handleCopy}
          aria-label="Copy link"
          title="Copy link"
          data-hide-on-export
        >
          <ContentCopy size={18} />
        </button>
        {canShare && (
          <button
            className={styles.button}
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
            className={styles.button}
            onClick={onExport}
            aria-label="Download as image"
            title="Download as image"
            data-hide-on-export
          >
            <DownloadIcon size={18} />
          </button>
        )}
        {onToggleZoom && (
          <button
            className={`${styles.button} ${styles.zoomButton}`}
            onClick={onToggleZoom}
            aria-label={zoomed ? "Zoom out" : "Zoom in"}
            title={zoomed ? "Zoom out" : "Zoom in"}
            data-hide-on-export
          >
            {zoomed ? <ZoomOutIcon size={18} /> : <ZoomInIcon size={18} />}
          </button>
        )}
        {showNowButton && onShowNow && (
          <button
            className={styles.button}
            onClick={onShowNow}
            aria-label="Show present day"
            title="Show present day"
            data-hide-on-export
          >
            <EventAvailable size={18} />
          </button>
        )}
      </div>
      {showToast && <div className={styles.toast} role="status" aria-live="polite">Link copied!</div>}
    </div>
  );
}
