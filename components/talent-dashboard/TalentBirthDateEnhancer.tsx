"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import TalentBirthDatePicker from "@/components/talent/TalentBirthDatePicker";

function setReactInputValue(input: HTMLInputElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
  descriptor?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function isArabicPage() {
  return document.documentElement.lang === "ar" || document.documentElement.dir === "rtl";
}

export function TalentBirthDateEnhancer() {
  const [input, setInput] = useState<HTMLInputElement | null>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [value, setValue] = useState("");

  useEffect(() => {
    let disposed = false;

    const enhance = () => {
      if (disposed) return;
      const dateInput = document.querySelector<HTMLInputElement>('input[type="date"]');
      if (!dateInput || dateInput.dataset.mlamhDobEnhanced === "1") return;

      const container = document.createElement("div");
      container.dataset.mlamhDobPicker = "1";
      container.className = "min-w-0 flex-1";
      dateInput.insertAdjacentElement("beforebegin", container);
      dateInput.dataset.mlamhDobEnhanced = "1";
      dateInput.tabIndex = -1;
      dateInput.setAttribute("aria-hidden", "true");
      dateInput.classList.add("!hidden");

      setValue(dateInput.value);
      setInput(dateInput);
      setHost(container);
    };

    enhance();
    const observer = new MutationObserver(enhance);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, []);

  if (!input || !host) return null;

  return createPortal(
    <TalentBirthDatePicker
      value={value}
      isArabic={isArabicPage()}
      onChange={(nextValue) => {
        setValue(nextValue);
        setReactInputValue(input, nextValue);
      }}
    />,
    host,
  );
}
