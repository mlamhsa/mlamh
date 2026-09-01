"use client";

import { useEffect } from "react";

const ATTRIBUTION_KEY = "mlamh_marketing_attribution";
const SESSION_KEY = "mlamh_anonymous_session_id";

type Attribution = {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  term: string | null;
};

function getSessionId() {
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;

  const created = crypto.randomUUID();
  window.localStorage.setItem(SESSION_KEY, created);
  return created;
}

function readAttribution(searchParams: URLSearchParams): Attribution {
  return {
    source: searchParams.get("utm_source"),
    medium: searchParams.get("utm_medium"),
    campaign: searchParams.get("utm_campaign"),
    content: searchParams.get("utm_content"),
    term: searchParams.get("utm_term"),
  };
}

function hasAttribution(value: Attribution) {
  return Boolean(
    value.source ||
      value.medium ||
      value.campaign ||
      value.content ||
      value.term,
  );
}

export default function MarketingAttributionTracker() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const incoming = readAttribution(params);

    let attribution = incoming;

    if (hasAttribution(incoming)) {
      window.localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(incoming));
    } else {
      const saved = window.localStorage.getItem(ATTRIBUTION_KEY);
      if (saved) {
        try {
          attribution = JSON.parse(saved) as Attribution;
        } catch {
          window.localStorage.removeItem(ATTRIBUTION_KEY);
        }
      }
    }

    const anonymousSessionId = getSessionId();

    void fetch("/api/marketing/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        event_name: "page_view",
        anonymous_session_id: anonymousSessionId,
        source: attribution.source,
        medium: attribution.medium,
        campaign: attribution.campaign,
        content: attribution.content,
        term: attribution.term,
        referrer: document.referrer || null,
        metadata: {
          path: window.location.pathname,
          query: window.location.search || null,
        },
      }),
    });
  }, []);

  return null;
}
