"use client";

import { useEffect } from "react";

export default function ClientFilesAnchor() {
  useEffect(() => {
    const placeholder = document.querySelector<HTMLElement>("main section#files");
    const live = document.querySelector<HTMLElement>("[data-managed-client-files]");
    if (placeholder) placeholder.removeAttribute("id");
    if (live) live.id = "files";
  }, []);
  return null;
}
