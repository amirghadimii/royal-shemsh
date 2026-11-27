"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001";

export function useEndpointAccess(endpoint: string) {
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("rs_session_token")
        : null;
    if (!token) return;

    fetch(`${API_BASE}${endpoint}`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 403) {
          setAccessDenied(true);
        }
      })
      .catch(() => {});
  }, [endpoint]);

  return { accessDenied };
}
