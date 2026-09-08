"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { trackEvent } from "@/lib/events/track-event";

export async function trackOpportunityViewAction({
  opportunityId,
}: {
  opportunityId: number;
}) {
  if (
    !Number.isInteger(opportunityId) ||
    opportunityId <= 0
  ) {
    return;
  }

  const supabase =
    await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  await trackEvent({
    type: "opportunity_viewed",
    target: "opportunity",
    targetId: opportunityId,
    actorId: user?.id ?? null,
    metadata: {
      logged_in: Boolean(user),
    },
  });
}