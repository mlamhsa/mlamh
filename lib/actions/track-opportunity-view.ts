"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { trackEvent } from "@/lib/events/track-event";

const ALLOWED_SHARE_CHANNELS = new Set(["native", "copy_link", "whatsapp"]);

export async function trackOpportunityViewAction({
  opportunityId,
  source,
  channel,
}: {
  opportunityId: number;
  source?: string;
  channel?: string;
}) {
  if (!Number.isInteger(opportunityId) || opportunityId <= 0) return;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const attributedSource = source === "opportunity_share" ? source : null;
  const attributedChannel = attributedSource && channel && ALLOWED_SHARE_CHANNELS.has(channel) ? channel : null;

  await trackEvent({
    type: "opportunity_viewed",
    target: "opportunity",
    targetId: opportunityId,
    actorId: user?.id ?? null,
    metadata: {
      logged_in: Boolean(user),
      ...(attributedSource ? { acquisition_source: attributedSource } : {}),
      ...(attributedChannel ? { acquisition_channel: attributedChannel } : {}),
    },
  });
}
