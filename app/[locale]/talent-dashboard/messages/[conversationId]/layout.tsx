import type { ReactNode } from "react";

import QuickRequestWorkflowDock from "@/components/messages/QuickRequestWorkflowDock";

type LayoutProps = {
  children: ReactNode;
  params: Promise<{
    locale: string;
    conversationId: string;
  }>;
};

export default async function TalentConversationLayout({
  children,
  params,
}: LayoutProps) {
  const { locale, conversationId: rawConversationId } = await params;
  const conversationId = Number(rawConversationId);

  return (
    <>
      {children}
      <QuickRequestWorkflowDock
        conversationId={conversationId}
        locale={locale}
      />
    </>
  );
}
