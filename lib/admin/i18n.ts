export type AdminLanguage = "ar" | "en";

export function getAdminLanguage(
  value?: string | null,
): AdminLanguage {
  return value === "en" ? "en" : "ar";
}

export function isAdminArabic(
  language: AdminLanguage,
) {
  return language === "ar";
}

export function withAdminLanguage(
  href: string,
  language: AdminLanguage,
) {
  const [pathname, existingQuery] =
    href.split("?");

  const params = new URLSearchParams(
    existingQuery ?? "",
  );

  params.set("lang", language);

  return `${pathname}?${params.toString()}`;
}

export const adminDictionary = {
  ar: {
    common: {
      arabic: "العربية",
      english: "English",
      search: "بحث",
      filter: "تصفية",
      all: "الكل",
      view: "عرض",
      edit: "تعديل",
      review: "مراجعة",
      approve: "اعتماد",
      reject: "رفض",
      requestChanges: "طلب تعديل",
      publish: "نشر",
      unpublish: "إلغاء النشر",
      featured: "مميز",
      save: "حفظ",
      cancel: "إلغاء",
      confirm: "تأكيد",
      loading: "جارٍ التحميل...",
      noResults: "لا توجد نتائج",
      previous: "السابق",
      next: "التالي",
      page: "الصفحة",
      of: "من",
      logout: "تسجيل الخروج",
      viewSite: "عرض الموقع",
      notifications: "الإشعارات",
      settings: "الإعدادات",
    },

    layout: {
      console: "لوحة الإدارة",
      platformOperations:
        "إدارة المنصة والعمليات",
      systemAdmin: "مدير النظام",
      platformControl: "إدارة المنصة",
      platformDescription:
        "إدارة المواهب والناشرين والفرص والطلبات.",
    },

    navigation: {
      overview: "نظرة عامة",
      dashboard: "لوحة التحكم",
      accountManagement: "إدارة الحسابات",
      talents: "المواهب",
      publishers: "الناشرون",
      operations: "التشغيل",
      opportunities: "الفرص",
      applications: "الطلبات",
      messages: "المحادثات",
      monitoring: "الرقابة والتحليلات",
      analytics: "التحليلات",
      notifications: "الإشعارات",
      auditLog: "سجل العمليات",
      system: "النظام",
      adminsRoles: "المشرفون والصلاحيات",
      settings: "الإعدادات",
    },

    statuses: {
      notSubmitted: "غير مرسل",
      pending: "قيد المراجعة",
      changesRequested: "مطلوب تعديل",
      approved: "معتمد",
      rejected: "مرفوض",
      suspended: "موقوف",
      published: "منشور",
      hidden: "مخفي",
      draft: "مسودة",
    },

    talents: {
      title: "إدارة المواهب",
      description:
        "مراجعة ملفات المواهب واعتمادها وإدارتها.",
      profiles: "ملفات المواهب",
      totalProfiles: "إجمالي الملفات",
      pendingReview: "بانتظار المراجعة",
      profileCompletion: "اكتمال الملف",
      category: "الفئة",
      city: "المدينة",
      phone: "رقم الجوال",
      availability: "حالة التوفر",
      lastUpdated: "آخر تحديث",
      reviewProfile: "مراجعة الملف",
      noTalents: "لا توجد ملفات مواهب.",
      topViewed: "الأكثر مشاهدة",
    },
  },

  en: {
    common: {
      arabic: "العربية",
      english: "English",
      search: "Search",
      filter: "Filter",
      all: "All",
      view: "View",
      edit: "Edit",
      review: "Review",
      approve: "Approve",
      reject: "Reject",
      requestChanges: "Request changes",
      publish: "Publish",
      unpublish: "Unpublish",
      featured: "Featured",
      save: "Save",
      cancel: "Cancel",
      confirm: "Confirm",
      loading: "Loading...",
      noResults: "No results found",
      previous: "Previous",
      next: "Next",
      page: "Page",
      of: "of",
      logout: "Logout",
      viewSite: "View site",
      notifications: "Notifications",
      settings: "Settings",
    },

    layout: {
      console: "Admin Console",
      platformOperations:
        "Platform operations",
      systemAdmin: "System Admin",
      platformControl: "Platform Control",
      platformDescription:
        "Manage talents, publishers, opportunities, and applications.",
    },

    navigation: {
      overview: "Overview",
      dashboard: "Dashboard",
      accountManagement: "Account Management",
      talents: "Talents",
      publishers: "Publishers",
      operations: "Operations",
      opportunities: "Opportunities",
      applications: "Applications",
      messages: "Messages",
      monitoring: "Monitoring",
      analytics: "Analytics",
      notifications: "Notifications",
      auditLog: "Audit Log",
      system: "System",
      adminsRoles: "Admins & Roles",
      settings: "Settings",
    },

    statuses: {
      notSubmitted: "Not submitted",
      pending: "Pending review",
      changesRequested: "Changes requested",
      approved: "Approved",
      rejected: "Rejected",
      suspended: "Suspended",
      published: "Published",
      hidden: "Hidden",
      draft: "Draft",
    },

    talents: {
      title: "Talent Management",
      description:
        "Review, approve, and manage talent profiles.",
      profiles: "Talent Profiles",
      totalProfiles: "Total profiles",
      pendingReview: "Pending review",
      profileCompletion: "Profile completion",
      category: "Category",
      city: "City",
      phone: "Phone number",
      availability: "Availability",
      lastUpdated: "Last updated",
      reviewProfile: "Review profile",
      noTalents: "No talent profiles found.",
      topViewed: "Top Viewed Talents",
    },
  },
} as const;

export function getAdminDictionary(
  language: AdminLanguage,
) {
  return adminDictionary[language];
}