import {
  Activity,
  BarChart3,
  Beaker,
  BellRing,
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  CalendarClock,
  CheckCheck,
  ClipboardPenLine,
  FileText,
  Inbox,
  Layers3,
  ListTodo,
  Megaphone,
  Palette,
  Plug,
  Send,
  Settings2,
  Target,
  UsersRound,
  Workflow,
} from "lucide-react";

export type MarketingHubNavItem = { key: string; labelAr: string; labelEn: string; href: string; icon: typeof Megaphone };
export type MarketingHubNavGroup = { key: string; labelAr: string; labelEn: string; icon: typeof Megaphone; itemKeys: string[] };

export const marketingHubNavigation: MarketingHubNavItem[] = [
  { key: "overview", labelAr: "مركز القيادة", labelEn: "Command", href: "/admin/marketing", icon: BarChart3 },
  { key: "ai-team", labelAr: "الفريق", labelEn: "AI Team", href: "/admin/marketing/ai-team", icon: Bot },
  { key: "tasks", labelAr: "المهام", labelEn: "Tasks", href: "/admin/marketing/tasks", icon: ListTodo },
  { key: "inbox", labelAr: "الوارد", labelEn: "Inbox", href: "/admin/marketing/inbox", icon: Inbox },
  { key: "leads", labelAr: "العملاء المحتملون", labelEn: "Leads", href: "/admin/marketing/leads", icon: Target },
  { key: "briefs", labelAr: "البريفات", labelEn: "Briefs", href: "/admin/marketing/briefs", icon: ClipboardPenLine },
  { key: "talent-growth", labelAr: "نمو المواهب", labelEn: "Talent Growth", href: "/admin/marketing/talent-growth", icon: UsersRound },
  { key: "opportunity-growth", labelAr: "نمو الفرص", labelEn: "Opportunity Growth", href: "/admin/marketing/opportunity-growth", icon: BriefcaseBusiness },
  { key: "content", labelAr: "المحتوى", labelEn: "Content", href: "/admin/marketing/content", icon: FileText },
  { key: "creative", labelAr: "الإبداع", labelEn: "Creative", href: "/admin/marketing/creative", icon: Palette },
  { key: "social", labelAr: "السوشيال", labelEn: "Social", href: "/admin/marketing/social", icon: Megaphone },
  { key: "campaigns", labelAr: "الحملات", labelEn: "Campaigns", href: "/admin/marketing/campaigns", icon: Layers3 },
  { key: "outreach", labelAr: "التواصل الخارجي", labelEn: "Outreach", href: "/admin/marketing/outreach", icon: Send },
  { key: "follow-ups", labelAr: "المتابعات", labelEn: "Follow-ups", href: "/admin/marketing/follow-ups", icon: CalendarClock },
  { key: "approvals", labelAr: "القرارات والاعتمادات", labelEn: "Decisions", href: "/admin/marketing/approvals", icon: CheckCheck },
  { key: "automation", labelAr: "الأتمتة", labelEn: "Automation", href: "/admin/marketing/automation", icon: Workflow },
  { key: "analytics", labelAr: "التحليلات", labelEn: "Analytics", href: "/admin/marketing/analytics", icon: Activity },
  { key: "experiments", labelAr: "التجارب", labelEn: "Experiments", href: "/admin/marketing/experiments", icon: Beaker },
  { key: "integrations", labelAr: "التكاملات", labelEn: "Integrations", href: "/admin/marketing/integrations", icon: Plug },
  { key: "knowledge", labelAr: "المعرفة وقواعد التشغيل", labelEn: "Knowledge / Playbooks", href: "/admin/marketing/knowledge", icon: BrainCircuit },
  { key: "activity", labelAr: "سجل الفريق", labelEn: "Team Activity", href: "/admin/marketing/activity", icon: BellRing },
  { key: "settings", labelAr: "الإعدادات", labelEn: "Settings", href: "/admin/marketing/settings", icon: Settings2 },
];

export const marketingHubNavigationGroups: MarketingHubNavGroup[] = [
  { key: "decisions", labelAr: "قراراتي", labelEn: "Decisions", icon: CheckCheck, itemKeys: ["approvals", "inbox"] },
  { key: "growth", labelAr: "النمو", labelEn: "Growth", icon: Target, itemKeys: ["leads", "outreach", "follow-ups", "briefs", "talent-growth", "opportunity-growth"] },
  { key: "content-work", labelAr: "المحتوى", labelEn: "Content", icon: Megaphone, itemKeys: ["content", "creative", "social", "campaigns"] },
  { key: "operations", labelAr: "الفريق والتنفيذ", labelEn: "Operations", icon: Workflow, itemKeys: ["ai-team", "tasks", "automation", "activity"] },
  { key: "insights", labelAr: "القياس والإعداد", labelEn: "Insights & Setup", icon: Settings2, itemKeys: ["analytics", "experiments", "integrations", "knowledge", "settings"] },
];

export const marketingHubCoreEntities = [
  "marketing_agents", "marketing_tasks", "marketing_agent_activity", "marketing_approvals", "marketing_leads", "marketing_contacts", "marketing_briefs", "marketing_content", "marketing_creatives", "marketing_campaigns", "marketing_outreach", "marketing_followups", "marketing_automation_rules", "marketing_events", "marketing_experiments", "marketing_integrations", "marketing_alerts", "marketing_playbooks",
] as const;
