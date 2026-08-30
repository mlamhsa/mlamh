type OpportunityLanguage = "ar" | "en";

type TranslationResult = {
  title: string;
  description: string;
};

const DEFAULT_MODELS = [
  "google/gemini-2.5-flash-lite",
  "openai/gpt-5-mini",
];

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseJsonContent(content: string): TranslationResult | null {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  try {
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const title = clean(parsed.title);
    const description = clean(parsed.description);

    if (!title || !description) return null;

    return { title, description };
  } catch {
    return null;
  }
}

async function requestTranslation({
  model,
  token,
  sourceLanguage,
  targetLanguage,
  title,
  description,
}: {
  model: string;
  token: string;
  sourceLanguage: OpportunityLanguage;
  targetLanguage: OpportunityLanguage;
  title: string;
  description: string;
}) {
  const sourceName = sourceLanguage === "ar" ? "Arabic" : "English";
  const targetName = targetLanguage === "ar" ? "Arabic" : "English";

  const response = await fetch(
    "https://ai-gateway.vercel.sh/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        stream: false,
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content:
              "You are MLAMH's professional casting marketplace translator. Translate faithfully and naturally. Preserve meaning, structure, bullet points, dates, numbers, brand names, Actor/Model terminology, and warnings. Do not invent facts or promises. Return JSON only with exactly two string fields: title and description.",
          },
          {
            role: "user",
            content: `Translate this MLAMH opportunity from ${sourceName} to ${targetName}.\n\nTITLE:\n${title}\n\nDESCRIPTION:\n${description}`,
          },
        ],
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: { content?: string | null };
    }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  return content ? parseJsonContent(content) : null;
}

export async function translateOpportunityContent({
  sourceLanguage,
  title,
  description,
}: {
  sourceLanguage: OpportunityLanguage;
  title: string;
  description: string;
}): Promise<TranslationResult> {
  const token =
    process.env.AI_GATEWAY_API_KEY ||
    process.env.VERCEL_OIDC_TOKEN;

  if (!token) {
    throw new Error(
      "Automatic translation is not configured for this environment.",
    );
  }

  const targetLanguage: OpportunityLanguage =
    sourceLanguage === "ar" ? "en" : "ar";

  const preferredModel = clean(process.env.MLAMH_TRANSLATION_MODEL);
  const models = preferredModel
    ? [preferredModel, ...DEFAULT_MODELS.filter((item) => item !== preferredModel)]
    : DEFAULT_MODELS;

  for (const model of models) {
    try {
      const translated = await requestTranslation({
        model,
        token,
        sourceLanguage,
        targetLanguage,
        title,
        description,
      });

      if (translated) return translated;
    } catch (error) {
      console.error(`[translateOpportunityContent:${model}]`, error);
    }
  }

  throw new Error(
    sourceLanguage === "ar"
      ? "تعذر إنشاء الترجمة الإنجليزية تلقائيًا. حاول مرة أخرى."
      : "Automatic Arabic translation failed. Please try again.",
  );
}
