"use client";

import ProfileStatusBanner from "./ProfileStatusBanner";

type Props = {
  profileCompletion: number;
};

export default function DashboardV2({ profileCompletion }: Props) {
  const missing = profileCompletion < 100
    ? ["الصورة الشخصية", "السيرة الذاتية", "الخبرات"]
    : [];

  return (
    <div className="space-y-6">

      {/* 🧠 SYSTEM HEADER */}
      <ProfileStatusBanner
        percentage={profileCompletion}
        missing={missing}
      />

      {/* ⚡ SMART CTA */}
      <div className="rounded-2xl border border-white/10 bg-black/30 p-5 flex items-center justify-between">
        <div>
          <p className="text-white text-sm">
            {profileCompletion < 100
              ? "أكمل ملفك لزيادة فرص القبول"
              : "جاهز للانطلاق نحو الفرص"}
          </p>

          <p className="text-xs text-gray-muted mt-1">
            النظام يقوم بتحليل ملفك تلقائياً
          </p>
        </div>

        <button className="rounded-xl bg-gold px-4 py-2 text-black text-sm hover:opacity-90 transition">
          {profileCompletion < 100 ? "إكمال الملف" : "تصفح الفرص"}
        </button>
      </div>

      {/* 📊 METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <p className="text-gray-muted text-xs">الطلبات</p>
          <p className="text-white text-2xl mt-2">0</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <p className="text-gray-muted text-xs">الحالة</p>
          <p className="text-gold text-sm mt-2">قيد الإعداد</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
          <p className="text-gray-muted text-xs">النشاط</p>
          <p className="text-white text-2xl mt-2">0</p>
        </div>

      </div>

      {/* 📡 ACTIVITY FEED */}
      <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
        <p className="text-white text-sm mb-3">آخر النشاطات</p>

        <p className="text-gray-muted text-sm">
          لا يوجد نشاطات حتى الآن
        </p>
      </div>

    </div>
  );
}