"use client";

import { useState, useEffect, useCallback } from "react";
import type { Submission } from "@/lib/types";
import styles from "@/styles/Admin.module.css";

const EVENT_TYPES = [
  "art", "book", "building", "computer", "film",
  "history", "music", "pop culture", "science", "sport",
];

interface SubmissionWithKey extends Submission {
  key: string;
}

interface SubmissionReviewProps {
  token: string;
}

export default function SubmissionReview({ token }: SubmissionReviewProps) {
  const [submissions, setSubmissions] = useState<SubmissionWithKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [edits, setEdits] = useState<Record<string, Partial<SubmissionWithKey>>>({});

  const getEdited = (sub: SubmissionWithKey) => ({
    ...sub,
    ...edits[sub.key],
  });

  const setField = (key: string, field: string, value: string | number | null) => {
    setEdits((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/submissions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setError("Failed to load submissions");
        return;
      }
      setSubmissions(await res.json());
    } catch {
      setError("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleAction = async (key: string, action: "approve" | "reject") => {
    const overrides = edits[key] || {};
    const res = await fetch("/api/admin/submissions", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ key, action, ...overrides }),
    });

    if (res.ok) {
      setSubmissions((prev) =>
        prev.map((s) =>
          s.key === key ? { ...s, status: action === "approve" ? "approved" : "rejected" } : s
        )
      );
    }
  };

  const pending = submissions.filter((s) => s.status === "pending");
  const processed = submissions.filter((s) => s.status !== "pending");

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {pending.length === 0 && !loading && <p className={styles.empty}>No pending submissions.</p>}

      {pending.map((sub) => {
        const edited = getEdited(sub);
        return (
          <div key={sub.key} className={styles.card}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Name</label>
              <input
                className={styles.fieldInput}
                value={edited.name}
                onChange={(e) => setField(sub.key, "name", e.target.value)}
              />
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Year</label>
                <div className={styles.yearRow}>
                  <input
                    className={styles.fieldInput}
                    type="number"
                    min="1"
                    value={Math.abs(edited.year)}
                    onChange={(e) => {
                      const abs = Math.abs(parseInt(e.target.value) || 1);
                      setField(sub.key, "year", edited.year < 0 ? -abs : abs);
                    }}
                  />
                  <select
                    className={styles.eraSelect}
                    value={edited.year < 0 ? "BC" : "AD"}
                    onChange={(e) => {
                      const abs = Math.abs(edited.year);
                      setField(sub.key, "year", e.target.value === "BC" ? -abs : abs);
                    }}
                  >
                    <option value="AD">A.D.</option>
                    <option value="BC">B.C.</option>
                  </select>
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Month</label>
                <input
                  className={styles.fieldInput}
                  type="number"
                  min="0"
                  max="12"
                  value={edited.month ?? ""}
                  onChange={(e) => setField(sub.key, "month", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="--"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Day</label>
                <input
                  className={styles.fieldInput}
                  type="number"
                  min="0"
                  max="31"
                  value={edited.day ?? ""}
                  onChange={(e) => setField(sub.key, "day", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="--"
                />
              </div>
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Type</label>
                <select
                  className={styles.fieldInput}
                  value={edited.type}
                  onChange={(e) => setField(sub.key, "type", e.target.value)}
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Plural</label>
                <select
                  className={styles.fieldInput}
                  value={edited.plural}
                  onChange={(e) => setField(sub.key, "plural", parseInt(e.target.value))}
                >
                  <option value={0}>no (is)</option>
                  <option value={1}>yes (are)</option>
                </select>
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Link</label>
              <input
                className={styles.fieldInput}
                value={edited.link}
                onChange={(e) => setField(sub.key, "link", e.target.value)}
              />
            </div>
            <div className={styles.cardActions}>
              <button
                className={styles.approveBtn}
                onClick={() => handleAction(sub.key, "approve")}
              >
                Approve
              </button>
              <button
                className={styles.rejectBtn}
                onClick={() => handleAction(sub.key, "reject")}
              >
                Reject
              </button>
            </div>
          </div>
        );
      })}

      {processed.length > 0 && (
        <>
          <h2 className={styles.subtitle}>Processed</h2>
          {processed.map((sub) => (
            <div key={sub.key} className={`${styles.card} ${styles.processed}`}>
              <div className={styles.cardHeader}>
                <strong>{sub.name}</strong>
                <span className={sub.status === "approved" ? styles.approved : styles.rejected}>
                  {sub.status}
                </span>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
