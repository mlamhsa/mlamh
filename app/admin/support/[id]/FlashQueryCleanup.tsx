"use client";

import { useEffect } from "react";

export default function FlashQueryCleanup() {
  useEffect(() => {
    const url = new URL(window.location.href);
    let changed = false;

    for (const key of ["error", "dana", "sent"]) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
    }

    if (changed) {
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }, []);

  return null;
}
