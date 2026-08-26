"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { trackEvent } from "@/lib/events/track-event";

export async function trackApplicationStartedAction({
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

  if (!user) {
    return;
  }

  await trackEvent({
    type: "application_started",
    target: "opportunity",
    targetId: opportunityId,
    actorId: user.id,
    metadata: {
      logged_in: true,
    },
  });
}