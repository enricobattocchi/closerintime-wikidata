"use client";

import { useState, useCallback, useEffect } from "react";
import { ContentCopy, DownloadIcon, ShareIcon, EventAvailable, ZoomInIcon, ZoomOutIcon, EditOutlined } from "@/components/Icon";
import styles from "@/styles/ShareToolbar.module.css";

interface ShareToolbarProps {
  href: string;
  title?: string;
  onExport?: () => void;
  showNowButton?: boolean;
  onShowNow?: () => void;
  zoomed?: boolean;
  onToggleZoom?: () => void;
  showEditTitle?: boolean;
  onEditTitle?: () => void;
}

export default function ShareToolbar({ href, title, onExport, showNowButton, onShowNow, zoomed, onToggleZoom, showEditTitle, onEditTitle }: ShareToolbarProps) {
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
          <ContentCopy size={22} />
        </button>
        {canShare && (
          <button
            className={styles.button}
            onClick={handleShare}
            aria-label="Share"
            title="Share"
            data-hide-on-export
          >
            <ShareIcon size={22} />
          </button>
        )}
        {onExport && (
          <button
            className={styles.button}
            onClick={zoomed ? undefined : onExport}
            disabled={zoomed}
            aria-label="Download as image"
            title={zoomed ? "Zoom out to download" : "Download as image"}
            data-hide-on-export
          >
            <DownloadIcon size={22} />
          </button>
        )}
        {showEditTitle && onEditTitle && (
          <button
            className={styles.button}
            onClick={onEditTitle}
            aria-label="Set title"
            title="Set title"
            data-hide-on-export
          >
            <EditOutlined size={22} />
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
            {zoomed ? <ZoomOutIcon size={22} /> : <ZoomInIcon size={22} />}
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
            <EventAvailable size={22} />
          </button>
        )}
      </div>
      {showToast && <div className={styles.toast} role="status" aria-live="polite">Link copied!</div>}
    </div>
  );
}
