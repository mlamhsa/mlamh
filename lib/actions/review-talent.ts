"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

function parseTalentId(formData: FormData): number | null {
  const raw = formData.get("id");
  const id = typeof raw === "string" ? Number(raw) : Number(raw);
  if (!Number.isFinite(id) || id <= 0) return null;
  return id;
}

export async function approveTalentAction(formData: FormData): Promise<void> {
  const id = parseTalentId(formData);
  if (!id) return;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("talents")
    .update({ status: "approved", published: true })
    .eq("id", id);

  if (error) {
    console.error("[approveTalentAction]", error.message);
    return;
  }

  revalidatePath("/admin");
}

export async function rejectTalentAction(formData: FormData): Promise<void> {
  const id = parseTalentId(formData);
  if (!id) return;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("talents")
    .update({ status: "rejected", published: false })
    .eq("id", id);

  if (error) {
    console.error("[rejectTalentAction]", error.message);
    return;
  }

  revalidatePath("/admin");
}
