"use client";

import { useEffect } from "react";

function findTalentSidebar() {
  const nav = document.querySelector<HTMLElement>(
    'nav[aria-label="تنقل الموهبة"], nav[aria-label="Talent navigation"]',
  );
  return nav?.closest<HTMLElement>("aside") ?? null;
}

export function TalentSidebarDockEnhancer() {
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1280px)");
    let sidebar: HTMLElement | null = null;

    const apply = () => {
      sidebar = findTalentSidebar();
      if (!sidebar) return;

      if (!media.matches) {
        sidebar.removeAttribute("style");
        return;
      }

      const isArabic = document.documentElement.lang === "ar" || document.documentElement.dir === "rtl";
      sidebar.style.position = "fixed";
      sidebar.style.top = "96px";
      sidebar.style.bottom = "0";
      sidebar.style.width = "20rem";
      sidebar.style.maxHeight = "calc(100vh - 96px)";
      sidebar.style.overflowY = "auto";
      sidebar.style.zIndex = "30";
      sidebar.style.borderRadius = "0";
      sidebar.style.borderTop = "0";
      sidebar.style.borderBottom = "0";
      sidebar.style.right = isArabic ? "0" : "auto";
      sidebar.style.left = isArabic ? "auto" : "0";
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });
    media.addEventListener("change", apply);
    window.addEventListener("resize", apply);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", apply);
      window.removeEventListener("resize", apply);
      sidebar?.removeAttribute("style");
    };
  }, []);

  return null;
}
