import type { ReactNode } from "react";

import QuickRequestWorkflowDock from "@/components/messages/QuickRequestWorkflowDock";
import QuickRequestWorkflowRealtime from "@/components/messages/QuickRequestWorkflowRealtime";

type LayoutProps = {
  children: ReactNode;
  params: Promise<{
    locale: string;
    conversationId: string;
  }>;
};

export default async function PublisherConversationLayout({
  children,
  params,
}: LayoutProps) {
  const { locale, conversationId: rawConversationId } = await params;
  const conversationId = Number(rawConversationId);

  return (
    <>
      {children}
      <QuickRequestWorkflowRealtime conversationId={conversationId} />
      <QuickRequestWorkflowDock
        conversationId={conversationId}
        locale={locale}
      />
    </>
  );
}
