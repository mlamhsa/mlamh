import type { ReactNode } from "react";

import { SceneWorldNav } from "@/components/scene/SceneWorldNav";

export default async function SceneLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale: "ar" | "en" = rawLocale === "en" ? "en" : "ar";

  return (
    <>
      <SceneWorldNav locale={locale} />
      {children}
    </>
  );
}
