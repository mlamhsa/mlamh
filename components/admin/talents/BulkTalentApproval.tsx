"use client";

import { createContext, useContext, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveTalentAction } from "@/lib/actions/review-talent";

const SelectionContext = createContext<{ selected: number[]; busy: boolean; toggle: (id: number) => void } | null>(null);

export function TalentSelectionCheckbox({ id }: { id: number }) {
  const ctx = useContext(SelectionContext);
  if (!ctx) return null;
  return <label className="absolute right-3 top-3 z-10 flex cursor-pointer items-center gap-1.5 rounded-lg border border-gold/30 bg-black/85 px-2 py-1.5 text-xs text-gold shadow-lg" onClick={event => event.stopPropagation()}>
    <input aria-label={`Select talent ${id}`} type="checkbox" checked={ctx.selected.includes(id)} disabled={ctx.busy} onChange={() => ctx.toggle(id)} className="h-5 w-5 accent-[#c5a468]" />
  </label>;
}

export function BulkTalentApproval({ items, language, children }: { items: { id: number; name: string }[]; language: "ar" | "en"; children: React.ReactNode }) {
  const ar = language === "ar";
  const router = useRouter();
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, start] = useTransition();
  const [result, setResult] = useState("");
  const eligible = items.map(item => item.id);
  const chosen = selected.filter(id => eligible.includes(id));
  const all = eligible.length > 0 && eligible.every(id => chosen.includes(id));
  const toggle = (id: number) => setSelected(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
  function approve() {
    if (!chosen.length || busy) return;
    if (!window.confirm(ar ? `اعتماد ${chosen.length} ملفًا محددًا؟ سيتم نشر الملفات المستوفية للشروط فقط.` : `Approve ${chosen.length} selected profiles? Only eligible profiles will be published.`)) return;
    start(async () => {
      let success = 0;
      const failures: string[] = [];
      for (const id of chosen) {
        const data = new FormData();
        data.set("id", String(id));
        data.set("locale", language);
        try {
          const response = await approveTalentAction(data);
          if (response.success) success++;
          else failures.push(`#${id}: ${response.message}`);
        } catch {
          failures.push(`#${id}: ${ar ? "تعذر الاعتماد" : "Approval failed"}`);
        }
      }
      setResult((ar ? `تم اعتماد ${success} من ${chosen.length} ملفات.` : `Approved ${success} of ${chosen.length} profiles.`) + (failures.length ? "\n" + failures.join("\n") : ""));
      setSelected([]);
      router.refresh();
    });
  }
  return <SelectionContext.Provider value={{ selected: chosen, busy, toggle }}>
    {items.length > 0 && <div className="mt-5 rounded-2xl border border-gold/20 bg-gold/[0.035] p-4" dir={ar ? "rtl" : "ltr"}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-white/80">
          <input type="checkbox" checked={all} disabled={busy} onChange={() => setSelected(all ? [] : eligible)} className="h-5 w-5 accent-[#c5a468]" />
          {ar ? "تحديد جميع الملفات المعلقة في هذه الصفحة" : "Select all pending profiles on this page"}
        </label>
        <button type="button" disabled={busy || !chosen.length} onClick={approve} className="min-h-11 rounded-xl bg-gold px-4 text-sm font-semibold text-black disabled:opacity-40">{busy ? (ar ? "جارٍ الاعتماد..." : "Approving...") : (ar ? `اعتماد المحدد (${chosen.length})` : `Approve selected (${chosen.length})`)}</button>
      </div>
      {result && <p role="status" className="mt-3 whitespace-pre-wrap text-xs leading-6 text-white/70">{result}</p>}
    </div>}
    {children}
  </SelectionContext.Provider>;
}
