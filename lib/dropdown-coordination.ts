export const DROPDOWN_OPEN_EVENT = "ripbao:dropdown-open";

export function announceDropdownOpen(sourceId: string) {
  document.dispatchEvent(
    new CustomEvent<string>(DROPDOWN_OPEN_EVENT, { detail: sourceId }),
  );
}
