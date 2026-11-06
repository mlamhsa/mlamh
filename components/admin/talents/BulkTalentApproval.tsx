"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { approveTalentAction } from "@/lib/actions/review-talent";

type Item = { id: number; name: string };
export function BulkTalentApproval({ items, language }: { items: Item[]; language: "ar" | "en" }) {
  const ar = language === "ar";
  const router = useRouter();
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, start] = useTransition();
  const [result, setResult] = useState("");
  const all = items.length > 0 && items.every(item => selected.includes(item.id));
  const toggle = (id: number) => setSelected(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
  function approve() {
    if (!selected.length || busy) return;
    if (!window.confirm(ar ? `اعتماد ${selected.length} ملفًا محددًا؟ سيتم نشر الملفات المستوفية للشروط فقط.` : `Approve ${selected.length} selected profiles? Only eligible profiles will be published.`)) return;
    start(async () => {
      let success = 0;
      const failures: string[] = [];
      for (const id of selected) {
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
      setResult(ar ? `تم اعتماد ${success} من ${selected.length} ملفات.` : `Approved ${success} of ${selected.length} profiles.`);
      if (failures.length) setResult(previous => previous + "\n" + failures.join("\n"));
      setSelected([]);
      router.refresh();
    });
  }
  return <div className="mt-5 rounded-2xl border border-gold/20 bg-gold/[0.035] p-4" dir={ar ? "rtl" : "ltr"}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <label className="flex cursor-pointer items-center gap-2 text-sm text-white/80">
        <input type="checkbox" checked={all} disabled={busy || items.length === 0} onChange={() => setSelected(all ? [] : items.map(x => x.id))} className="h-5 w-5 accent-[#c5a468]" />
        {ar ? "تحديد جميع الملفات المعلقة في هذه الصفحة" : "Select all pending profiles on this page"}
      </label>
      <button type="button" disabled={busy || !selected.length} onClick={approve} className="min-h-11 rounded-xl bg-gold px-4 text-sm font-semibold text-black disabled:opacity-40">{busy ? (ar ? "جارٍ الاعتماد..." : "Approving...") : (ar ? `اعتماد المحدد (${selected.length})` : `Approve selected (${selected.length})`)}</button>
    </div>
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {items.map(item => <label key={item.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white/75">
        <input type="checkbox" checked={selected.includes(item.id)} disabled={busy} onChange={() => toggle(item.id)} className="h-5 w-5 shrink-0 accent-[#c5a468]" />
        <span className="min-w-0 flex-1 truncate">{item.name}</span>
        <a href={`/admin/talents/${item.id}?lang=${language}`} target="_blank" rel="noopener noreferrer" onClick={event => event.stopPropagation()} className="shrink-0 text-xs text-gold underline">{ar ? "عرض" : "View"}</a>
      </label>)}
    </div>
    {result && <p role="status" className="mt-3 whitespace-pre-wrap text-xs leading-6 text-white/70">{result}</p>}
  </div>;
}
