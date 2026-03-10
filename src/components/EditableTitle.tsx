"use client";

import { useRef, useCallback, useEffect } from "react";
import styles from "@/styles/EditableTitle.module.css";

interface EditableTitleProps {
  value: string;
  onChange: (value: string) => void;
}

const MAX_LENGTH = 100;
const PLACEHOLDER = "my timeline";

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

export default function EditableTitle({ value, onChange }: EditableTitleProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value.replace(/\n/g, "").slice(0, MAX_LENGTH);
      onChange(text);
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

  return (
    <div className={styles.container}>
      <textarea
        ref={textareaRef}
        className={styles.input}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={PLACEHOLDER}
        maxLength={MAX_LENGTH}
        rows={1}
        aria-label="Timeline title"
        data-hide-on-export
      />
      <span className={styles.exportText} data-show-on-export>
        {value || PLACEHOLDER}
      </span>
    </div>
  );
}
