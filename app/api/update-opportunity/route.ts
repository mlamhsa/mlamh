import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const allowedStatuses = ["draft", "open", "published", "closed", "archived"];

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function numberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;

  const raw = typeof value === "number" ? String(value) : cleanText(value);
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_");
}

export async function POST(request: Request) {
  try {
    const authClient = await createServerSupabaseClient();
    const adminClient = createAdminClient();

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();

    const locale = cleanText(body.locale) === "en" ? "en" : "ar";
    const opportunityId = numberOrNull(body.id);

    if (!opportunityId) {
      return NextResponse.json(
        { error: "Opportunity ID is required." },
        { status: 400 }
      );
    }

    const title = cleanText(body.title);
    const description = cleanText(body.description);
    const cityAr = cleanText(body.city_ar) || cleanText(body.city);
    const cityEn = cleanText(body.city_en) || cleanText(body.city);
    const gender = cleanText(body.required_gender) || cleanText(body.gender);
    const opportunityType = cleanText(body.opportunity_type);
    const status = cleanText(body.status) || "draft";
    const minAge = numberOrNull(body.min_age);
    const maxAge = numberOrNull(body.max_age);
    const budget = cleanText(body.budget);

    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    if (!description) {
      return NextResponse.json(
        { error: "Description is required." },
        { status: 400 }
      );
    }

    if (!cityAr || !cityEn) {
      return NextResponse.json({ error: "City is required." }, { status: 400 });
    }

    if (!opportunityType) {
      return NextResponse.json(
        { error: "Opportunity type is required." },
        { status: 400 }
      );
    }

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid opportunity status." },
        { status: 400 }
      );
    }

    if (minAge !== null && maxAge !== null && minAge > maxAge) {
      return NextResponse.json(
        { error: "Minimum age cannot be greater than maximum age." },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found." },
        { status: 404 }
      );
    }

    const { data: publisher, error: publisherError } = await adminClient
      .from("publishers")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (publisherError || !publisher) {
      return NextResponse.json(
        { error: "Publisher account not found." },
        { status: 403 }
      );
    }

    const { data: opportunity, error: opportunityError } = await adminClient
      .from("opportunities")
      .select("id, publisher_id")
      .eq("id", opportunityId)
      .eq("publisher_id", publisher.id)
      .maybeSingle();

    if (opportunityError || !opportunity) {
      return NextResponse.json(
        { error: "Opportunity not found or access denied." },
        { status: 404 }
      );
    }

    const citySlug = createSlug(cityEn || cityAr);

    const { data: updatedOpportunity, error: updateError } = await adminClient
      .from("opportunities")
      .update({
        title,
        description,
        city_slug: citySlug,
        city_ar: cityAr,
        city_en: cityEn,
        required_gender: gender || null,
        opportunity_type: opportunityType,
        min_age: minAge,
        max_age: maxAge,
        budget: budget || null,
        status,
        published: status === "published" || status === "open",
        updated_at: new Date().toISOString(),
      })
      .eq("id", opportunity.id)
      .eq("publisher_id", publisher.id)
      .select("id")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    revalidatePath(`/${locale}/publisher-dashboard`);
    revalidatePath(`/${locale}/publisher-dashboard/opportunities`);
    revalidatePath(`/${locale}/publisher-dashboard/opportunities/${opportunity.id}`);
    revalidatePath(`/${locale}/publisher-dashboard/opportunities/${opportunity.id}/edit`);
    revalidatePath(`/${locale}/opportunities`);

    return NextResponse.json({
      success: true,
      opportunity: updatedOpportunity,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update opportunity.",
      },
      { status: 500 }
    );
  }
}