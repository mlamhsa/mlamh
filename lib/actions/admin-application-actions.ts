"use server";

import { revalidatePath } from "next/cache";
import {
  type AdminApplicationStatus,
  updateAdminApplicationStatus,
} from "@/lib/supabase/admin-applications";

async function setApplicationStatus(formData: FormData, status: AdminApplicationStatus) {
  const id = Number(formData.get("application_id"));
  if (!id) return;

  await updateAdminApplicationStatus({ id, status });

  revalidatePath("/admin/opportunity-applications");
  revalidatePath(`/admin/opportunity-applications/${id}`);
}

export async function markPendingApplicationAction(formData: FormData) {
  await setApplicationStatus(formData, "pending");
}

export async function shortlistApplicationAction(formData: FormData) {
  await setApplicationStatus(formData, "shortlisted");
}

export async function acceptApplicationAction(formData: FormData) {
  await setApplicationStatus(formData, "accepted");
}

export async function rejectAdminApplicationAction(formData: FormData) {
  await setApplicationStatus(formData, "rejected");
}