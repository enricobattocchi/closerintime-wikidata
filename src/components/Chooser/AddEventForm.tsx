"use client";

import { useState } from "react";
import { currentYear, daysInMonth } from "@/lib/date-utils";
import styles from "@/styles/AddEventForm.module.css";

interface AddEventFormProps {
  onSave: (event: {
    name: string;
    year: number;
    month: number | null;
    day: number | null;
    type: string;
    plural: number;
    link: string | null;
  }) => void;
  onCancel: () => void;
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const EVENT_TYPES = [
  "art", "book", "building", "computer", "film",
  "history", "music", "pop culture", "science", "sport",
];

const WIKIPEDIA_RE = /^https:\/\/[a-z]{2,}\.wikipedia\.org\/wiki\/.+$/;

export default function AddEventForm({ onSave, onCancel }: AddEventFormProps) {
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [era, setEra] = useState<"AD" | "BC">("AD");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [plural, setPlural] = useState(0);
  const [error, setError] = useState("");
  const [submitForEveryone, setSubmitForEveryone] = useState(false);
  const [type, setType] = useState("history");
  const [link, setLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const yearInput = parseInt(year, 10);
  const yearNum = era === "BC" ? -yearInput : yearInput;
  const monthNum = parseInt(month, 10);
  const maxDay =
    year && month
      ? daysInMonth(yearNum, monthNum - 1)
      : 31;

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!year || isNaN(yearInput) || yearInput < 1) {
      setError("Valid year is required (minimum 1)");
      return;
    }
    if (yearNum >= currentYear()) {
      setError("Year must be in the past");
      return;
    }

    if (submitForEveryone) {
      if (!link.trim() || !WIKIPEDIA_RE.test(link.trim())) {
        setError("A valid Wikipedia URL is required (e.g. https://en.wikipedia.org/wiki/...)");
        return;
      }

      setSubmitting(true);
      setError("");
      try {
        const res = await fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            year: yearNum,
            month: month ? monthNum : null,
            day: month && day ? parseInt(day) : null,
            type,
            plural,
            link: link.trim(),
          }),
        });
        if (res.status === 429) {
          setError("Too many submissions. Please try again later.");
          return;
        }
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Submission failed");
          return;
        }
        setSubmitted(true);
        setTimeout(() => onCancel(), 2000);
      } catch {
        setError("Network error");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    onSave({
      name: name.trim(),
      year: yearNum,
      month: month ? monthNum : null,
      day: month && day ? parseInt(day) : null,
      type: "personal",
      plural,
      link: null,
    });
  };

  if (submitted) {
    return (
      <div className={styles.form}>
        <p className={styles.success}>Submitted for review. Thank you!</p>
      </div>
    );
  }

  return (
    <div className={styles.form}>
      <div className={styles.field}>
        <label className={styles.label}>Event name *</label>
        <input
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. my birthday"
        />
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Year *</label>
          <div className={styles.yearRow}>
            <input
              className={styles.input}
              type="number"
              min="1"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g. 1990"
            />
            <select
              className={styles.eraSelect}
              value={era}
              onChange={(e) => setEra(e.target.value as "AD" | "BC")}
            >
              <option value="AD">A.D.</option>
              <option value="BC">B.C.</option>
            </select>
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Month</label>
          <select
            className={styles.input}
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              setDay("");
            }}
            disabled={!year}
          >
            <option value="">--</option>
            {months.map((m, i) => (
              <option key={i} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Day</label>
          <select
            className={styles.input}
            value={day}
            onChange={(e) => setDay(e.target.value)}
            disabled={!month}
          >
            <option value="">--</option>
            {Array.from({ length: maxDay }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Grammar</label>
        <div className={styles.radioGroup}>
          <label className={styles.radio}>
            <input
              type="radio"
              checked={plural === 0}
              onChange={() => setPlural(0)}
            />
            Singular (is)
          </label>
          <label className={styles.radio}>
            <input
              type="radio"
              checked={plural === 1}
              onChange={() => setPlural(1)}
            />
            Plural (are)
          </label>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={submitForEveryone}
            onChange={(e) => setSubmitForEveryone(e.target.checked)}
          />
          Submit for everyone
        </label>
      </div>

      {submitForEveryone && (
        <>
          <div className={styles.field}>
            <label className={styles.label}>Category *</label>
            <select
              className={styles.input}
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Wikipedia link *</label>
            <input
              className={styles.input}
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://en.wikipedia.org/wiki/..."
            />
          </div>
        </>
      )}

      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.actions}>
        <button className={styles.cancelBtn} onClick={onCancel}>
          Cancel
        </button>
        <button
          className={styles.saveBtn}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : submitForEveryone ? "Submit for review" : "Save"}
        </button>
      </div>
    </div>
  );
}
