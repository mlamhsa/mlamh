import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

const allowedTalentTypes = new Set(["actor", "model", "mixed"]);

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Simple honeypot for obvious automated spam.
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
    const requiredCount = Math.max(1, Math.min(1000, Number(body.required_count) || 1));
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
        client_status_note:
          locale === "ar"
            ? "تم استلام طلبكم وهو الآن بانتظار مراجعة فريق MLAMH Casting."
            : "Your brief has been received and is awaiting review by the MLAMH Casting team.",
        requirements: {
          submitted_locale: locale,
        },
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
