"use server";

import { revalidatePath } from "next/cache";
import { FooterService } from "@/lib/services/FooterService";

function getBooleanValue(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

export async function updateFooterSettingsAction(formData: FormData) {
  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid footer settings id.");
  }

  const data = {
    description_ar: String(formData.get("description_ar") ?? "").trim() || null,
    description_en: String(formData.get("description_en") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    address_ar: String(formData.get("address_ar") ?? "").trim() || null,
    address_en: String(formData.get("address_en") ?? "").trim() || null,
    copyright_ar: String(formData.get("copyright_ar") ?? "").trim() || null,
    copyright_en: String(formData.get("copyright_en") ?? "").trim() || null,
    show_contact_info: getBooleanValue(formData.get("show_contact_info")),
    show_social_links: getBooleanValue(formData.get("show_social_links")),
  };

  const { error } = await FooterService.updateSettings(data);

  if (error) {
    console.error("Update footer settings error:", error);
    throw new Error("Failed to update footer settings.");
  }

  revalidatePath("/admin/footer");
  revalidatePath("/", "layout");
}

export async function createFooterLinkAction(formData: FormData) {
  const section = String(formData.get("section") ?? "").trim();
  const labelAr = String(formData.get("label_ar") ?? "").trim();
  const labelEn = String(formData.get("label_en") ?? "").trim();
  const href = String(formData.get("href") ?? "").trim();
  const sortOrder = Number(formData.get("sort_order") ?? 0);

  if (!section || !labelAr || !labelEn || !href) {
    throw new Error("Footer link fields are required.");
  }

  const allowedSections = [
    "platform",
    "talent",
    "publisher",
    "legal",
    "social",
  ];

  if (!allowedSections.includes(section)) {
    throw new Error("Invalid footer link section.");
  }

  const data = {
    section,
    label_ar: labelAr,
    label_en: labelEn,
    href,
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    is_active: getBooleanValue(formData.get("is_active")),
    open_in_new_tab: getBooleanValue(formData.get("open_in_new_tab")),
  };

  const { error } = await FooterService.createLink(data);

  if (error) {
    console.error("Create footer link error:", error);
    throw new Error("Failed to create footer link.");
  }

  revalidatePath("/admin/footer");
  revalidatePath("/", "layout");
}

export async function updateFooterLinkAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const section = String(formData.get("section") ?? "").trim();
  const labelAr = String(formData.get("label_ar") ?? "").trim();
  const labelEn = String(formData.get("label_en") ?? "").trim();
  const href = String(formData.get("href") ?? "").trim();
  const sortOrder = Number(formData.get("sort_order") ?? 0);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid footer link id.");
  }

  if (!section || !labelAr || !labelEn || !href) {
    throw new Error("Footer link fields are required.");
  }

  const data = {
    section,
    label_ar: labelAr,
    label_en: labelEn,
    href,
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    is_active: getBooleanValue(formData.get("is_active")),
    open_in_new_tab: getBooleanValue(formData.get("open_in_new_tab")),
  };

  const { error } = await FooterService.updateLink({
    id,
    data,
  });

  if (error) {
    console.error("Update footer link error:", error);
    throw new Error("Failed to update footer link.");
  }

  revalidatePath("/admin/footer");
  revalidatePath("/", "layout");
}

export async function deleteFooterLinkAction(formData: FormData) {
  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid footer link id.");
  }

  const { error } = await FooterService.deleteLink(id);

  if (error) {
    console.error("Delete footer link error:", error);
    throw new Error("Failed to delete footer link.");
  }

  revalidatePath("/admin/footer");
  revalidatePath("/", "layout");
}