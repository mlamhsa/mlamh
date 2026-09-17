import { mobileApiRequest } from "@/src/api/client";

export type ManagedCastingPayload = {
  client_name: string;
  company_name?: string;
  contact_email?: string;
  contact_phone?: string;
  project_title: string;
  talent_type: "actor" | "model" | "mixed";
  required_count: number;
  city?: string;
  work_date?: string;
  budget?: string;
  brief: string;
  locale: "ar" | "en";
  company_website?: string;
};

export type ManagedCastingResponse = {
  ok: true;
  requestId?: number;
  trackingPath?: string;
};

export function submitManagedCastingRequest(payload: ManagedCastingPayload) {
  return mobileApiRequest<ManagedCastingResponse>("/api/casting/request", {
    method: "POST",
    authenticated: false,
    body: payload,
  });
}
