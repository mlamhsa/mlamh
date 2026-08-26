"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { trackEvent } from "@/lib/events/track-event";

export type OpportunityShareChannel =
  | "native"
  | "copy_link";

export async function trackOpportunityShareAction({
  opportunityId,
  channel,
}: {
  opportunityId: number;
  channel: OpportunityShareChannel;
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
    type: "opportunity_shared",
    target: "opportunity",
    targetId: opportunityId,
    actorId: user?.id ?? null,
    metadata: {
      share_channel: channel,
      logged_in: Boolean(user),
    },
  });
}