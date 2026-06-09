import Link from "next/link";

export default function PublisherShell({
  locale,
  isRtl,
  children,
}: {
  locale: string;
  isRtl: boolean;
  children: React.ReactNode;
}) {
  const items = [
    {
      href: `/${locale}/publisher-dashboard`,
      label: isRtl ? "نظرة عامة" : "Overview",
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
    <main
      dir={isRtl ? "rtl" : "ltr"}
      className="min-h-screen bg-black text-white"
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:px-6 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-8 lg:py-8">
        <aside className="h-fit rounded-[1.5rem] border border-white/10 bg-white/[0.025] p-4 lg:sticky lg:top-6">
          <Link href={`/${locale}/publisher-dashboard`} className="block">
            <p className="text-xs uppercase tracking-[0.35em] text-gold">
              MLAMH
            </p>

            <h2 className="mt-2 text-xl font-light">
              {isRtl ? "لوحة الناشر" : "Publisher"}
            </h2>

            <p className="mt-2 text-xs leading-5 text-white/35">
              {isRtl
                ? "إدارة الفرص والمتقدمين"
                : "Opportunities & applicants"}
            </p>
          </Link>

          <nav className="mt-6 grid gap-2">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl border border-transparent px-4 py-3 text-sm text-white/55 transition hover:border-gold/30 hover:bg-gold/[0.06] hover:text-gold"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-6 border-t border-white/10 pt-5">
            <Link
              href={`/${locale}/opportunities/new`}
              className="flex justify-center rounded-xl border border-gold bg-gold/10 px-4 py-3 text-center text-xs uppercase tracking-[0.18em] text-gold transition hover:bg-gold hover:text-black"
            >
              {isRtl ? "إنشاء فرصة" : "Create Opportunity"}
            </Link>
          </div>
        </aside>

        <section className="min-w-0">{children}</section>
      </div>
    </main>
  );
}