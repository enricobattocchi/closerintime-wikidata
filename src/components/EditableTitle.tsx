"use client";

import { useRef, useState, useCallback, useEffect, useImperativeHandle, forwardRef } from "react";
import { useTranslations } from "next-intl";
import styles from "@/styles/EditableTitle.module.css";

interface EditableTitleProps {
  value: string;
  onChange: (value: string) => void;
}

export interface EditableTitleHandle {
  focus: () => void;
}

const MAX_LENGTH = 100;

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = "0";
  el.style.height = `${el.scrollHeight}px`;
}

export default forwardRef<EditableTitleHandle, EditableTitleProps>(function EditableTitle({ value, onChange }, ref) {
  const t = useTranslations("chooser");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);
  const visible = value || focused;

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
  }));

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value.replace(/\n/g, "").slice(0, MAX_LENGTH);
      onChange(text);
      if (textareaRef.current) autoResize(textareaRef.current);
    },
    [onChange]
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      textareaRef.current?.blur();
    }
  }, []);

  // Auto-resize on value change and on mount
  useEffect(() => {
    if (textareaRef.current) autoResize(textareaRef.current);
  }, [value]);

  // Re-measure when the container width changes (window resize, layout shift)
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => autoResize(el));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`${styles.container}${visible ? "" : ` ${styles.collapsed}`}`}>
      <div className={styles.inputWrapper}>
        <textarea
          ref={textareaRef}
          className={styles.input}
          value={value}
          placeholder={t("timelineName")}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          maxLength={MAX_LENGTH}
          rows={1}
          aria-label={t("timelineTitle")}
          data-hide-on-export
        />
      </div>
      {value && (
        <span className={styles.exportText} data-show-on-export>
          {value}
        </span>
      )}
    </div>
  );
});
