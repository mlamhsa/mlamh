export type ExecutiveMarketplaceInput = {
  talentProfiles: number;
  qualifiedTalents: number;
  publishers: number;
  publishedOpportunities: number;
  applications: number;
  acceptedApplications: number;
  activeConversations: number;
};

export type ExecutiveMetric = {
  key:
    | "qualified_talent_rate"
    | "application_acceptance_rate"
    | "applications_per_opportunity"
    | "conversation_followthrough_rate";
  value: number | null;
  unit: "percent" | "ratio";
  deterministic: true;
};

export type ExecutivePriority = {
  key: string;
  severity: "info" | "opportunity" | "warning" | "critical";
  title: string;
  titleAr: string;
  summary: string;
  summaryAr: string;
  facts: Record<string, number | string | boolean | null>;
  deterministic: true;
};

export type ExecutiveBrief = {
  generatedAt: string;
  market: "SA";
  mode: "shadow";
  metrics: ExecutiveMetric[];
  priorities: ExecutivePriority[];
  operatingLoop: {
    supplyAvailable: boolean;
    demandAvailable: boolean;
    applicationsAvailable: boolean;
    selectionsAvailable: boolean;
    connectionsAvailable: boolean;
    complete: boolean;
  };
};

function percent(value: number, total: number): number | null {
  if (total <= 0) return null;
  return Math.round((value / total) * 1000) / 10;
}

function ratio(value: number, total: number): number | null {
  if (total <= 0) return null;
  return Math.round((value / total) * 10) / 10;
}

export function buildExecutiveBrief(
  marketplace: ExecutiveMarketplaceInput,
  generatedAt = new Date().toISOString(),
): ExecutiveBrief {
  const operatingLoop = {
    supplyAvailable: marketplace.qualifiedTalents > 0,
    demandAvailable: marketplace.publishedOpportunities > 0,
    applicationsAvailable: marketplace.applications > 0,
    selectionsAvailable: marketplace.acceptedApplications > 0,
    connectionsAvailable: marketplace.activeConversations > 0,
    complete:
      marketplace.qualifiedTalents > 0 &&
      marketplace.publishedOpportunities > 0 &&
      marketplace.applications > 0 &&
      marketplace.acceptedApplications > 0 &&
      marketplace.activeConversations > 0,
  };

  const metrics: ExecutiveMetric[] = [
    {
      key: "qualified_talent_rate",
      value: percent(marketplace.qualifiedTalents, marketplace.talentProfiles),
      unit: "percent",
      deterministic: true,
    },
    {
      key: "application_acceptance_rate",
      value: percent(marketplace.acceptedApplications, marketplace.applications),
      unit: "percent",
      deterministic: true,
    },
    {
      key: "applications_per_opportunity",
      value: ratio(marketplace.applications, marketplace.publishedOpportunities),
      unit: "ratio",
      deterministic: true,
    },
    {
      key: "conversation_followthrough_rate",
      value: percent(marketplace.activeConversations, marketplace.acceptedApplications),
      unit: "percent",
      deterministic: true,
    },
  ];

  const priorities: ExecutivePriority[] = [];

  if (marketplace.talentProfiles > 0 && marketplace.qualifiedTalents === 0) {
    priorities.push({
      key: "restore_qualified_supply",
      severity: "critical",
      title: "Restore qualified talent supply",
      titleAr: "استعادة العرض المؤهل من المواهب",
      summary: "Talent profiles exist, but none currently pass the platform qualification rules.",
      summaryAr: "توجد ملفات مواهب، لكن لا توجد موهبة تجتاز قواعد التأهيل الحالية للمنصة.",
      facts: {
        talentProfiles: marketplace.talentProfiles,
        qualifiedTalents: marketplace.qualifiedTalents,
      },
      deterministic: true,
    });
  }

  if (marketplace.publishedOpportunities === 0) {
    priorities.push({
      key: "restore_live_demand",
      severity: marketplace.publishers > 0 ? "warning" : "info",
      title: "No live opportunity demand",
      titleAr: "لا يوجد طلب حي عبر فرص منشورة",
      summary: "No published opportunities are currently available in the operating loop.",
      summaryAr: "لا توجد فرص منشورة حاليًا داخل الحلقة التشغيلية.",
      facts: {
        publishers: marketplace.publishers,
        publishedOpportunities: marketplace.publishedOpportunities,
      },
      deterministic: true,
    });
  } else if (marketplace.applications === 0) {
    priorities.push({
      key: "activate_applications",
      severity: "warning",
      title: "Published demand has no applications",
      titleAr: "الطلب المنشور لم يولّد طلبات تقديم",
      summary: "Published opportunities exist, but no applications are recorded yet.",
      summaryAr: "توجد فرص منشورة، لكن لا توجد طلبات تقديم مسجلة حتى الآن.",
      facts: {
        publishedOpportunities: marketplace.publishedOpportunities,
        applications: marketplace.applications,
      },
      deterministic: true,
    });
  } else if (marketplace.acceptedApplications === 0) {
    priorities.push({
      key: "activate_selection",
      severity: "warning",
      title: "Applications have not converted to selections",
      titleAr: "طلبات التقديم لم تتحول إلى اختيارات بعد",
      summary: "Applications exist, but none are currently accepted.",
      summaryAr: "توجد طلبات تقديم، لكن لا توجد طلبات مقبولة حاليًا.",
      facts: {
        applications: marketplace.applications,
        acceptedApplications: marketplace.acceptedApplications,
      },
      deterministic: true,
    });
  } else if (marketplace.activeConversations === 0) {
    priorities.push({
      key: "activate_connection",
      severity: "warning",
      title: "Selections have not produced active connections",
      titleAr: "الاختيارات لم تتحول إلى تواصل نشط بعد",
      summary: "Accepted applications exist, but no active conversations are recorded.",
      summaryAr: "توجد طلبات مقبولة، لكن لا توجد محادثات نشطة مسجلة حاليًا.",
      facts: {
        acceptedApplications: marketplace.acceptedApplications,
        activeConversations: marketplace.activeConversations,
      },
      deterministic: true,
    });
  }

  if (operatingLoop.complete) {
    priorities.push({
      key: "operating_loop_active",
      severity: "opportunity",
      title: "Core marketplace loop is active",
      titleAr: "الحلقة الأساسية للسوق تعمل",
      summary: "Qualified supply, published demand, applications, selections and active connections are all present.",
      summaryAr: "العرض المؤهل والطلب المنشور والتقديمات والاختيارات والتواصل النشط كلها موجودة في الحلقة الحالية.",
      facts: {
        qualifiedTalents: marketplace.qualifiedTalents,
        publishedOpportunities: marketplace.publishedOpportunities,
        applications: marketplace.applications,
        acceptedApplications: marketplace.acceptedApplications,
        activeConversations: marketplace.activeConversations,
      },
      deterministic: true,
    });
  }

  return {
    generatedAt,
    market: "SA",
    mode: "shadow",
    metrics,
    priorities,
    operatingLoop,
  };
}
