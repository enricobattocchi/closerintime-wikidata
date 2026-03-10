"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function NavigationLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  useEffect(() => {
    const origPush = window.history.pushState.bind(window.history);
    let current = window.location.pathname;

    window.history.pushState = function (...args) {
      const url = args[2];
      const next = typeof url === "string" ? url : url?.toString() ?? "";
      if (next && next !== current) {
        setLoading(true);
        current = next;
      }
      return origPush(...args);
    };

    return () => {
      window.history.pushState = origPush;
    };
  }, []);

  if (!loading) return null;
  return <div className="loading-bar" />;
}
