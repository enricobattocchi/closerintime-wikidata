"use client";

import { useState, useEffect } from "react";
import SubmissionReview from "./SubmissionReview";
import EventManager from "./EventManager";
import styles from "@/styles/Admin.module.css";

type Tab = "submissions" | "events";

export default function AdminShell() {
  const [token, setToken] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("submissions");

  useEffect(() => {
    const saved = sessionStorage.getItem("adminToken");
    if (saved) {
      setToken(saved);
      setAuthenticated(true);
    }
  }, []);

  const handleLogin = async () => {
    if (!token.trim()) return;
    // Verify token by making a test request
    const res = await fetch("/api/admin/submissions", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      setError("Invalid token");
      return;
    }
    sessionStorage.setItem("adminToken", token);
    setAuthenticated(true);
    setError("");
  };

  if (!authenticated) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Admin</h1>
        <div className={styles.loginForm}>
          <input
            className={styles.input}
            type="password"
            placeholder="Admin token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          <button className={styles.loginBtn} onClick={handleLogin}>
            Login
          </button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === "submissions" ? styles.activeTab : ""}`}
          onClick={() => setTab("submissions")}
        >
          Submissions
        </button>
        <button
          className={`${styles.tab} ${tab === "events" ? styles.activeTab : ""}`}
          onClick={() => setTab("events")}
        >
          Events
        </button>
      </div>
      {tab === "submissions" ? (
        <SubmissionReview token={token} />
      ) : (
        <EventManager token={token} />
      )}
    </div>
  );
}
