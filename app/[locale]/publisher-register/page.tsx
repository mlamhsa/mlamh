import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function PublisherRegisterRedirectPage({
  params,
}: PageProps) {
  const { locale } = await params;
  const safeLocale = locale === "en" ? "en" : "ar";

  redirect(`/${safeLocale}/join?type=publisher`);
}
