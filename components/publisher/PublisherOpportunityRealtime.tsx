"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

function cleanCreatedParams(pathname: string, searchParams: URLSearchParams) {
  const next = new URLSearchParams(searchParams.toString());
  next.delete("created");
  next.delete("id");
  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export default function PublisherOpportunityRealtime({
  publisherId,
}: {
  publisherId: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname.includes("/publisher-dashboard/opportunities")) return;

    const supabase = createBrowserSupabaseClient();
    const createdId = Number(searchParams.get("id"));
    const wasCreated = searchParams.get("created") === "1";
    let active = true;

    const clearStaleCreatedBanner = async () => {
      if (!wasCreated || !Number.isInteger(createdId) || createdId <= 0) return;

      const { data } = await supabase
        .from("opportunities")
        .select("status")
        .eq("id", createdId)
        .eq("publisher_id", publisherId)
        .maybeSingle();

      if (!active || !data) return;

      if (data.status !== "pending_review") {
        router.replace(cleanCreatedParams(pathname, searchParams));
      }
    };

    void clearStaleCreatedBanner();

    const channel = supabase
      .channel(`publisher-opportunities-${publisherId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "opportunities",
          filter: `publisher_id=eq.${publisherId}`,
        },
        (payload) => {
          const changed = (payload.new ?? {}) as { id?: number; status?: string };

          if (
            wasCreated &&
            changed.id === createdId &&
            changed.status &&
            changed.status !== "pending_review"
          ) {
            router.replace(cleanCreatedParams(pathname, searchParams));
            return;
          }

          router.refresh();
        },
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [pathname, publisherId, router, searchParams]);

  return null;
}
