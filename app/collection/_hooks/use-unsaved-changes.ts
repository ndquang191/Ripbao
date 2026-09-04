"use client";

import { useEffect } from "react";

export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    const click = (event: MouseEvent) => {
      if (!dirty || event.defaultPrevented || event.button) return;
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest("a[href]");
      if (
        anchor instanceof HTMLAnchorElement &&
        anchor.origin === location.origin &&
        anchor.pathname !== location.pathname &&
        !confirm("Bạn có thay đổi chưa lưu. Bạn vẫn muốn rời trang?")
      )
        event.preventDefault();
    };
    addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    return () => {
      removeEventListener("beforeunload", unload);
      document.removeEventListener("click", click, true);
    };
  }, [dirty]);
}
