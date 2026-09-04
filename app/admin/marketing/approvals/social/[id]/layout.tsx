import Link from "next/link";

export default async function SocialApprovalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <>
    <div className="mx-auto max-w-7xl px-6 pt-6">
      <div className="flex justify-end">
        <Link
          href={`/admin/marketing/approvals/social/${id}/edit?lang=ar`}
          className="rounded-xl border border-gold/25 bg-gold/[0.07] px-4 py-2.5 text-sm font-medium text-gold transition hover:bg-gold/[0.12]"
        >
          تعديل المحتوى قبل الموافقة
        </Link>
      </div>
    </div>
    {children}
  </>;
}
