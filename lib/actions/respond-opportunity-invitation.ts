"use server";

import { revalidatePath } from "next/cache";

import { requireTalent } from "@/lib/auth/require-talent";
import { createAdminClient } from "@/lib/supabase/admin";

export type InvitationResponseState = {
  success: boolean;
  message: string | null;
};

const ALLOWED_RESPONSES = new Set(["accepted", "declined"]);

export async function respondOpportunityInvitationAction(
  _previousState: InvitationResponseState | null,
  formData: FormData,
): Promise<InvitationResponseState> {
  const locale = formData.get("locale") === "en" ? "en" : "ar";
  const invitationId = Number(formData.get("invitation_id"));
  const response = String(formData.get("response") ?? "").trim().toLowerCase();

  if (
    !Number.isInteger(invitationId) ||
    invitationId <= 0 ||
    !ALLOWED_RESPONSES.has(response)
  ) {
    return {
      success: false,
      message: locale === "ar" ? "بيانات الدعوة غير صحيحة." : "Invalid invitation.",
    };
  }

  const { talent } = await requireTalent(locale);
  if (!talent?.id) {
    return {
      success: false,
      message: locale === "ar" ? "تعذر التحقق من ملف الموهبة." : "Unable to verify talent profile.",
    };
  }

  const admin = createAdminClient();
  const { data: invitation, error: lookupError } = await admin
    .from("opportunity_invitations")
    .select("id,talent_id,status,opportunity_id")
    .eq("id", invitationId)
    .eq("talent_id", talent.id)
    .maybeSingle();

  if (lookupError) {
    console.error("[respondOpportunityInvitationAction.lookup]", lookupError);
    return {
      success: false,
      message: locale === "ar" ? "تعذر تحميل الدعوة." : "Unable to load invitation.",
    };
  }

  if (!invitation) {
    return {
      success: false,
      message: locale === "ar" ? "الدعوة غير موجودة." : "Invitation not found.",
    };
  }

  if (invitation.status !== "sent") {
    return {
      success: true,
      message:
        locale === "ar"
          ? invitation.status === "accepted"
            ? "سبق قبول هذه الدعوة."
            : "سبق الرد على هذه الدعوة."
          : invitation.status === "accepted"
            ? "This invitation was already accepted."
            : "This invitation was already answered.",
    };
  }

  const { error: updateError } = await admin
    .from("opportunity_invitations")
    .update({ status: response })
    .eq("id", invitation.id)
    .eq("talent_id", talent.id)
    .eq("status", "sent");

  if (updateError) {
    console.error("[respondOpportunityInvitationAction.update]", updateError);
    return {
      success: false,
      message: locale === "ar" ? "تعذر حفظ ردك. حاول مرة أخرى." : "Unable to save your response. Please try again.",
    };
  }

  revalidatePath(`/${locale}/talent-dashboard/requests`);
  revalidatePath(`/${locale}/talent-dashboard`);

  return {
    success: true,
    message:
      response === "accepted"
        ? locale === "ar"
          ? "تم قبول التواصل. لن نشارك رقمك أو بيانات اتصالك خارج ملامح."
          : "Contact accepted. Your phone or external contact details will not be shared."
        : locale === "ar"
          ? "تم الاعتذار عن الدعوة."
          : "Invitation declined.",
  };
}
