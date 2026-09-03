"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const MESSAGE_DELAY_MS = 180;
const SAFETY_TIMEOUT_MS = 7000;

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

export default function GlobalInteractionFeedback() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = () => {
    if (messageTimer.current) clearTimeout(messageTimer.current);
    if (safetyTimer.current) clearTimeout(safetyTimer.current);
    messageTimer.current = null;
    safetyTimer.current = null;
    setActive(false);
    setShowMessage(false);
  };

  const start = () => {
    if (messageTimer.current) clearTimeout(messageTimer.current);
    if (safetyTimer.current) clearTimeout(safetyTimer.current);
    setActive(true);
    setShowMessage(false);
    messageTimer.current = setTimeout(() => setShowMessage(true), MESSAGE_DELAY_MS);
    safetyTimer.current = setTimeout(stop, SAFETY_TIMEOUT_MS);
  };

  useEffect(() => {
    stop();
    // Route completion is represented by pathname/search-param updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams?.toString()]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || isModifiedClick(event)) return;
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.hasAttribute("download") || anchor.target === "_blank") return;
      if (anchor.dataset.noLoadingFeedback === "true") return;

      let nextUrl: URL;
      try {
        nextUrl = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (nextUrl.origin !== window.location.origin) return;
      const current = new URL(window.location.href);
      const sameDocument = nextUrl.pathname === current.pathname && nextUrl.search === current.search;
      if (sameDocument) return;

      start();
    };

    const onPageShow = () => stop();
    document.addEventListener("click", onClick, true);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("pageshow", onPageShow);
      if (messageTimer.current) clearTimeout(messageTimer.current);
      if (safetyTimer.current) clearTimeout(safetyTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!active) return null;

  const isArabic = typeof document === "undefined" || document.documentElement.dir === "rtl";
  const label = isArabic ? "جاري الفتح…" : "Opening…";

  return (
    <>
      <div className="mlamh-route-progress" aria-hidden="true">
        <span />
      </div>
      {showMessage ? (
        <div className="mlamh-loading-pill" role="status" aria-live="polite" aria-atomic="true">
          <span className="mlamh-loading-spinner" aria-hidden="true" />
          <span>{label}</span>
        </div>
      ) : null}
      <span className="sr-only" role="status" aria-live="polite">{label}</span>
    </>
  );
}
