"use client";

import { useState } from "react";

export default function TalentPreviewModal({
  talent,
}: {
  talent: any;
}) {
  const [open, setOpen] = useState(false);

  if (!talent) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-blue-300 underline"
      >
        View Profile
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#111] p-6 rounded-2xl w-[500px] max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-white text-lg">
                {talent.name_en || talent.name_ar}
              </h2>

              <button
                onClick={() => setOpen(false)}
                className="text-red-400"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-2 text-sm text-white/70">
              <p>Category: {talent.category_en}</p>
              <p>City: {talent.city_en}</p>
              <p>Experience: {talent.experience_years} years</p>
              <p>Completion: {talent.profile_completion}%</p>
              <p>Views: {talent.profile_views}</p>
            </div>

            {talent.skills?.length > 0 && (
              <div className="mt-4">
                <p className="text-white mb-2">Skills:</p>
                <div className="flex flex-wrap gap-2">
                  {talent.skills.map((s: string, i: number) => (
                    <span
                      key={i}
                      className="text-xs border border-white/20 px-2 py-1 rounded"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}