"use client";

import { useEffect } from "react";

export function HomeScrollReset() {
  useEffect(() => {
    const previousScrollRestoration =
      window.history.scrollRestoration;

    window.history.scrollRestoration = "manual";

    const resetScroll = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });
    };

    resetScroll();

    window.addEventListener(
      "pageshow",
      resetScroll,
    );

    return () => {
      window.removeEventListener(
        "pageshow",
        resetScroll,
      );

      window.history.scrollRestoration =
        previousScrollRestoration;
    };
  }, []);

  return null;
}