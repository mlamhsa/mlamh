"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const ALLOWED_STATUSES = ["completed", "in_progress", "pending", "blocked"];

export async function updateProjectStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const notes = String(formData.get("notes") ?? "");

  if (!id) {
    throw new Error("Missing project status id.");
  }

  if (!ALLOWED_STATUSES.includes(status)) {
    throw new Error("Invalid project status.");
  }

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized.");
  }

  const { error } = await supabase
    .from("project_status")
    .update({
      status,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/ar/project-status");
  revalidatePath("/en/project-status");
}