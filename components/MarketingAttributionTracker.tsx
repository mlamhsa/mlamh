"use client";

import { useEffect } from "react";

import {
  MARKETING_ATTRIBUTION_COOKIE,
  hasMarketingAttribution,
  sanitizeMarketingAttribution,
  serializeMarketingAttribution,
  type MarketingAttributionContext,
} from "@/lib/marketing/attribution/context";

const ATTRIBUTION_KEY = "mlamh_marketing_attribution";
const SESSION_KEY = "mlamh_anonymous_session_id";
const ATTRIBUTION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

function getSessionId() {
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;

  const created = crypto.randomUUID();
  window.localStorage.setItem(SESSION_KEY, created);
  return created;
}

function readAttribution(
  searchParams: URLSearchParams,
  landingPath: string,
  anonymousSessionId: string,
): MarketingAttributionContext {
  return sanitizeMarketingAttribution({
    source: searchParams.get("utm_source"),
    medium: searchParams.get("utm_medium"),
    campaign: searchParams.get("utm_campaign"),
    content: searchParams.get("utm_content"),
    term: searchParams.get("utm_term"),
    landingPath,
    anonymousSessionId,
  });
}

function persistAttribution(value: MarketingAttributionContext) {
  const sanitized = sanitizeMarketingAttribution(value);
  if (!hasMarketingAttribution(sanitized)) return;

  window.localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(sanitized));
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${MARKETING_ATTRIBUTION_COOKIE}=${serializeMarketingAttribution(sanitized)}; Path=/; Max-Age=${ATTRIBUTION_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

export default function MarketingAttributionTracker() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const anonymousSessionId = getSessionId();
    const incoming = readAttribution(
      params,
      window.location.pathname,
      anonymousSessionId,
    );
    const isAttributedLanding = hasMarketingAttribution(incoming);

    let attribution = incoming;

    if (isAttributedLanding) {
      persistAttribution(incoming);
    } else {
      const saved = window.localStorage.getItem(ATTRIBUTION_KEY);
      if (saved) {
        try {
          attribution = sanitizeMarketingAttribution(JSON.parse(saved));
          persistAttribution(attribution);
        } catch {
          window.localStorage.removeItem(ATTRIBUTION_KEY);
        }
      }
    }

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
          attribution_landing: isAttributedLanding,
          landing_path: attribution.landingPath,
        },
      }),
    });
  }, []);

  return null;
}
