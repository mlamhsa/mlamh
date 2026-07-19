export const PERMISSIONS = {
    ADMIN_DASHBOARD_VIEW: "admin.dashboard.view",
    ADMIN_SITE_MANAGEMENT_VIEW: "admin.site_management.view",
  
    CMS_FOOTER_VIEW: "cms.footer.view",
    CMS_FOOTER_EDIT: "cms.footer.edit",
  
    CMS_HOMEPAGE_VIEW: "cms.homepage.view",
    CMS_HOMEPAGE_EDIT: "cms.homepage.edit",
  
    CMS_NAVIGATION_VIEW: "cms.navigation.view",
    CMS_NAVIGATION_EDIT: "cms.navigation.edit",
  
    CMS_SEO_VIEW: "cms.seo.view",
    CMS_SEO_EDIT: "cms.seo.edit",
  
    CMS_LEGAL_VIEW: "cms.legal.view",
    CMS_LEGAL_EDIT: "cms.legal.edit",
  
    ROLES_VIEW: "roles.view",
    ROLES_MANAGE: "roles.manage",
  
    ADMINS_VIEW: "admins.view",
    ADMINS_MANAGE: "admins.manage",
  } as const;
  
  export type Permission =
    (typeof PERMISSIONS)[keyof typeof PERMISSIONS];