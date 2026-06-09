import Link from "next/link";

export default function PublisherDashboardNav({
  locale,
  isRtl,
}: {
  locale: string;
  isRtl: boolean;
}) {
  const items = [
    {
      href: `/${locale}/publisher-dashboard`,
      label: isRtl ? "لوحة التحكم" : "Dashboard",
    },
    {
      href: `/${locale}/publisher-dashboard/opportunities`,
      label: isRtl ? "الفرص" : "Opportunities",
    },
    {
      href: `/${locale}/publisher-dashboard/applicants`,
      label: isRtl ? "المتقدمون" : "Applicants",
    },
    {
      href: `/${locale}/publisher-dashboard/profile`,
      label: isRtl ? "ملف الشركة" : "Company Profile",
    },
    {
      href: `/${locale}/publisher-dashboard/settings`,
      label: isRtl ? "الإعدادات" : "Settings",
    },
  ];

  return (
    <nav className="mb-10 rounded-[2rem] border border-white/10 bg-white/[0.025] p-4">
      <div className="flex flex-wrap gap-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl border border-white/10 px-5 py-3 text-xs uppercase tracking-[0.22em] text-white/55 transition hover:border-gold/50 hover:bg-gold/10 hover:text-gold"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}