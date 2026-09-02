"use client";

import { useEffect, useState } from "react";

import { trackOpportunityViewAction } from "@/lib/actions/track-opportunity-view";
import { trackTikTokBrowserEvent } from "@/lib/tiktok/browser";

type OpportunityViewTrackerProps = {
  opportunityId: number;
};

export default function OpportunityViewTracker({
  opportunityId,
}: OpportunityViewTrackerProps) {
  const [managedByMlamh, setManagedByMlamh] = useState(false);
  const [isEnglish, setIsEnglish] = useState(false);

  useEffect(() => {
    setIsEnglish(window.location.pathname.startsWith("/en/"));

    if (
      !Number.isInteger(opportunityId) ||
      opportunityId <= 0
    ) {
      return;
    }

    let cancelled = false;

    void fetch(`/api/opportunities/${opportunityId}/managed-status`, {
      method: "GET",
      cache: "no-store",
    })
      .then((response) =>
        response.ok ? response.json() : null,
      )
      .then((payload) => {
        if (!cancelled && payload?.managedByMlamh === true) {
          setManagedByMlamh(true);
        }
      })
      .catch(() => {
        // The badge is supplementary; never block the opportunity page.
      });

    const storageKey =
      `mlamh:opportunity-view:${opportunityId}`;

    try {
      if (
        window.sessionStorage.getItem(storageKey)
      ) {
        return () => {
          cancelled = true;
        };
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

    trackTikTokBrowserEvent("ViewContent", {
      content_id: String(opportunityId),
      content_name: `opportunity:${opportunityId}`,
    });

    void trackOpportunityViewAction({
      opportunityId,
    });

    return () => {
      cancelled = true;
    };
  }, [opportunityId]);

  if (!managedByMlamh) {
    return null;
  }

  return (
    <div className="mx-auto mb-3 w-full max-w-7xl">
      <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/[0.07] px-3 py-2 text-[10px] text-emerald-200 sm:px-4 sm:text-xs">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" />
        <span className="truncate">
          {isEnglish
            ? "Managed by MLAMH Casting"
            : "إدارة الكاستينغ بواسطة ملامح"}
        </span>
      </div>

      <p className="mt-2 max-w-2xl text-[11px] leading-6 text-white/35 sm:text-xs">
        {isEnglish
          ? "MLAMH Casting manages applications, screening and the shortlist for this opportunity. Final selection remains with the project owner."
          : "تدير MLAMH Casting استقبال الطلبات وفرز المرشحين والقائمة المختصرة لهذه الفرصة، بينما يبقى قرار الاختيار النهائي للجهة صاحبة المشروع."}
      </p>
    </div>
  );
}
