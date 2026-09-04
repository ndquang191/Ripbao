export const DROPDOWN_OPEN_EVENT = "ripbao:dropdown-open";

export function announceDropdownOpen(
  sourceId: string,
  currentDetails?: HTMLDetailsElement | null,
) {
  document
    .querySelectorAll<HTMLDetailsElement>("details[data-filter-dropdown][open]")
    .forEach((dropdown) => {
      if (dropdown !== currentDetails) dropdown.removeAttribute("open");
    });

  document.dispatchEvent(
    new CustomEvent<string>(DROPDOWN_OPEN_EVENT, { detail: sourceId }),
  );
}
