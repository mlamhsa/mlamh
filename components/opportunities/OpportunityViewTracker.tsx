"use client";

import { useEffect } from "react";

import { trackOpportunityViewAction } from "@/lib/actions/track-opportunity-view";

type OpportunityViewTrackerProps = {
  opportunityId: number;
};

export default function OpportunityViewTracker({
  opportunityId,
}: OpportunityViewTrackerProps) {
  useEffect(() => {
    if (
      !Number.isInteger(opportunityId) ||
      opportunityId <= 0
    ) {
      return;
    }

    const storageKey =
      `mlamh:opportunity-view:${opportunityId}`;

    try {
      if (
        window.sessionStorage.getItem(storageKey)
      ) {
        return;
      }

      window.sessionStorage.setItem(
        storageKey,
        "1",
      );
    } catch {
      /*
       * إذا منع المتصفح sessionStorage،
       * لا نمنع تسجيل المشاهدة.
       */
    }

    void trackOpportunityViewAction({
      opportunityId,
    });
  }, [opportunityId]);

  return null;
}