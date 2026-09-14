"use client";

import { type RefObject, useEffect, useRef } from "react";
import {
  announceDropdownOpen,
  DROPDOWN_OPEN_EVENT,
} from "@/lib/dropdown-coordination";

export function useCoordinatedDropdown(
  open: boolean,
  sourceId: string,
  rootRef: RefObject<HTMLElement | null>,
  close: () => void,
) {
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  }, [close]);

  useEffect(() => {
    const closeForOtherDropdown = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== sourceId)
        closeRef.current();
    };
    document.addEventListener(DROPDOWN_OPEN_EVENT, closeForOtherDropdown);
    return () =>
      document.removeEventListener(DROPDOWN_OPEN_EVENT, closeForOtherDropdown);
  }, [sourceId]);

  useEffect(() => {
    if (!open) return;
    announceDropdownOpen(sourceId);
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) closeRef.current();
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, rootRef, sourceId]);
}
