import { CircleHelp, Eye, EyeOff } from "lucide-react";

type Props = {
  language: "ar" | "en";
  visibility?: string | null;
};

export function AdminTalentPrivacyNotice({ language, visibility }: Props) {
  const isArabic = language === "ar";
  const normalizedVisibility = String(visibility ?? "").trim().toLowerCase();
  const isPrivate = normalizedVisibility === "private";
  const isPublic = normalizedVisibility === "public";
  const isUnknown = !isPrivate && !isPublic;
  const Icon = isPrivate ? EyeOff : isPublic ? Eye : CircleHelp;

  return (
    <section
      className={`rounded-3xl border p-5 sm:p-6 ${
        isPrivate
          ? "border-violet-400/20 bg-violet-400/[0.045]"
          : isPublic
            ? "border-emerald-400/20 bg-emerald-400/[0.045]"
            : "border-amber-400/20 bg-amber-400/[0.045]"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${
            isPrivate
              ? "border-violet-400/25 bg-violet-400/10 text-violet-200"
              : isPublic
                ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                : "border-amber-400/25 bg-amber-400/10 text-amber-200"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.24em] text-gold">
            {isArabic ? "اختيار ظهور الملف" : "Profile visibility choice"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-light text-white">
              {isPrivate
                ? isArabic ? "ملف خاص" : "Private profile"
                : isPublic
                  ? isArabic ? "ملف عام بعد الاعتماد" : "Public after approval"
                  : isArabic ? "طريقة الظهور غير مكتملة" : "Visibility not completed"}
            </h2>
            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] ${
                isPrivate
                  ? "border-violet-400/20 bg-violet-400/[0.08] text-violet-200"
                  : isPublic
                    ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200"
                    : "border-amber-400/20 bg-amber-400/[0.08] text-amber-200"
              }`}
            >
              {isPrivate
                ? (isArabic ? "خاص" : "PRIVATE")
                : isPublic
                  ? (isArabic ? "عام" : "PUBLIC")
                  : (isArabic ? "غير محدد" : "NOT SET")}
            </span>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/50">
            {isPrivate
              ? isArabic
                ? "اختارت الموهبة عدم الظهور في دليل المواهب العام. يمكن اعتماد الملف واستخدامه للمطابقة الخاصة والـBriefs المناسبة، لكنه يجب أن يبقى غير منشور للعامة."
                : "The talent chose not to appear in the public talent directory. The profile may be approved and used for private matching and relevant Briefs, but it must remain unpublished publicly."
              : isPublic
                ? isArabic
                  ? "وافقت الموهبة على ظهور ملفها في دليل المواهب العام بعد الاعتماد، مع استمرار تطبيق قواعد الاعتماد وجودة الصورة."
                  : "The talent agreed to appear in the public talent directory after approval, subject to approval and profile-photo requirements."
                : isArabic
                  ? "لا توجد قيمة صالحة محفوظة لطريقة ظهور الملف. لا نعتبر الملف عامًا أو خاصًا حتى تختار الموهبة ذلك صراحة."
                  : "No valid profile visibility choice is stored. The profile is not treated as public or private until the talent explicitly chooses one."}
          </p>
          {isUnknown ? (
            <p className="mt-2 text-xs text-amber-200/75">
              {isArabic ? "هذه الحالة تمنع إرسال الملف للمراجعة حتى يتم اختيار طريقة الظهور." : "This blocks review submission until a visibility choice is saved."}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
