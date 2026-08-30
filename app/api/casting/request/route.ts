import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

const allowedTalentTypes = new Set(["actor", "model", "mixed"]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[0-9][0-9\s()-]{6,24}$/;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isValidWorkDate(value: string) {
  if (!value) return true;
  if (!isoDatePattern.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json({ error: "Unsupported content type." }, { status: 415 });
    }

    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    // Honeypot: acknowledge obvious bots without creating a project.
    if (clean(body.company_website, 200)) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const clientName = clean(body.client_name, 120);
    const companyName = clean(body.company_name, 160);
    const contactEmail = clean(body.contact_email, 180).toLowerCase();
    const contactPhone = clean(body.contact_phone, 50);
    const projectTitle = clean(body.project_title, 180);
    const talentType = clean(body.talent_type, 20);
    const city = clean(body.city, 100);
    const budget = clean(body.budget, 100);
    const brief = clean(body.brief, 5000);
    const locale = clean(body.locale, 5) === "en" ? "en" : "ar";
    const rawRequiredCount = Number(body.required_count);
    const requiredCount = Number.isInteger(rawRequiredCount) && rawRequiredCount >= 1 && rawRequiredCount <= 1000
      ? rawRequiredCount
      : 1;
    const workDate = clean(body.work_date, 20) || null;

    if (!clientName || !projectTitle || !brief || !allowedTalentTypes.has(talentType)) {
      return NextResponse.json(
        { error: locale === "ar" ? "يرجى إكمال البيانات المطلوبة." : "Please complete the required fields." },
        { status: 400 },
      );
    }

    if (!contactEmail && !contactPhone) {
      return NextResponse.json(
        { error: locale === "ar" ? "أضف بريدًا إلكترونيًا أو رقم تواصل." : "Add an email address or contact number." },
        { status: 400 },
      );
    }

    if (contactEmail && !emailPattern.test(contactEmail)) {
      return NextResponse.json(
        { error: locale === "ar" ? "صيغة البريد الإلكتروني غير صحيحة." : "Enter a valid email address." },
        { status: 400 },
      );
    }

    if (contactPhone && !phonePattern.test(contactPhone)) {
      return NextResponse.json(
        { error: locale === "ar" ? "صيغة رقم التواصل غير صحيحة." : "Enter a valid contact number." },
        { status: 400 },
      );
    }

    if (!isValidWorkDate(workDate || "")) {
      return NextResponse.json(
        { error: locale === "ar" ? "تاريخ العمل غير صحيح." : "Enter a valid work date." },
        { status: 400 },
      );
    }

    const clientAccessToken = crypto.randomUUID();
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("casting_projects")
      .insert({
        service_mode: "managed",
        status: "new",
        client_name: clientName,
        company_name: companyName || null,
        contact_email: contactEmail || null,
        contact_phone: contactPhone || null,
        project_title: projectTitle,
        talent_type: talentType,
        city: city || null,
        required_count: requiredCount,
        work_date: workDate,
        budget: budget || null,
        brief,
        source: "website_casting_request",
        client_access_token: clientAccessToken,
        client_shared_at: new Date().toISOString(),
        client_status_note:
          locale === "ar"
            ? "تم استلام طلبكم وهو الآن بانتظار مراجعة فريق MLAMH Casting."
            : "Your brief has been received and is awaiting review by the MLAMH Casting team.",
        requirements: { submitted_locale: locale },
      })
      .select("id")
      .single();

    if (error) {
      console.error("[casting/request] insert failed", error);
      return NextResponse.json(
        { error: locale === "ar" ? "تعذر إرسال الطلب الآن. حاول مرة أخرى." : "We could not submit your request. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      requestId: data.id,
      trackingPath: `/${locale}/casting/status/${clientAccessToken}`,
    });
  } catch (error) {
    console.error("[casting/request] unexpected error", error);
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
