"use client";

import { type RefObject, useEffect, useRef } from "react";

export function useModalDialog(
  panel: RefObject<HTMLElement | null>,
  close: () => void,
) {
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  }, [close]);

  useEffect(() => {
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
      if (event.key !== "Tab" || !panel.current) return;
      const nodes = [
        ...panel.current.querySelectorAll<HTMLElement>(
          'button,input,[href],[tabindex]:not([tabindex="-1"])',
        ),
      ].filter((node) => !node.hasAttribute("disabled"));
      const first = nodes[0];
      const last = nodes.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [panel]);
}
