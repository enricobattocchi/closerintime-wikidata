"use client";

import { useRef, useCallback, useEffect } from "react";
import { EditOutlined } from "@/components/Icon";
import styles from "@/styles/EditableTitle.module.css";

interface EditableTitleProps {
  value: string;
  onChange: (value: string) => void;
}

const MAX_LENGTH = 100;
const PLACEHOLDER = "my timeline";

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = "0";
  el.style.height = `${el.scrollHeight}px`;
}

export default function EditableTitle({ value, onChange }: EditableTitleProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    <div className={styles.container}>
      <div className={styles.inputWrapper}>
        {!value && (
          <span
            className={styles.placeholder}
            onClick={() => textareaRef.current?.focus()}
            data-hide-on-export
          >
            {PLACEHOLDER} <EditOutlined size={14} />
          </span>
        )}
        <textarea
          ref={textareaRef}
          className={styles.input}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          maxLength={MAX_LENGTH}
          rows={1}
          aria-label="Timeline title"
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
}
