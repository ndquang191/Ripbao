"use client";

import { useEffect, useId, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { ResponsiveDropdownPanel } from "@/components/ui/responsive-dropdown-panel";
import {
  announceDropdownOpen,
  DROPDOWN_OPEN_EVENT,
} from "@/lib/dropdown-coordination";
import { RIFTBOUND_DOMAIN_COLORS } from "@/lib/riftbound-constants";
import { cn } from "@/lib/utils";

export function DomainFilter({
  value,
  options,
  onChange,
  className,
}: {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <FilterDropdown
      label="Domain"
      value={value}
      options={options}
      onChange={onChange}
      className={className}
      showDomainColors
    />
  );
}

export function FilterDropdown({
  label,
  value,
  options,
  onChange,
  className,
  ariaLabel,
  showDomainColors = false,
  allowEmpty = true,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  className?: string;
  ariaLabel?: string;
  showDomainColors?: boolean;
  allowEmpty?: boolean;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const dropdownId = useId();

  useEffect(() => {
    const close = () => detailsRef.current?.removeAttribute("open");
    const closeForOtherDropdown = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== dropdownId) close();
    };
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!detailsRef.current?.contains(event.target as Node)) close();
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener(DROPDOWN_OPEN_EVENT, closeForOtherDropdown);
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener(DROPDOWN_OPEN_EVENT, closeForOtherDropdown);
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [dropdownId]);

  const choose = (nextValue: string) => {
    onChange(nextValue);
    detailsRef.current?.removeAttribute("open");
  };

  const closeOtherDropdowns = () => {
    const current = detailsRef.current;
    if (!current?.open) return;
    announceDropdownOpen(dropdownId);
  };

  return (
    <details
      ref={detailsRef}
      onToggle={closeOtherDropdowns}
      className={cn("group relative z-10 shrink-0 open:z-[100]", className)}
    >
      <summary
        aria-label={ariaLabel}
        className="flex h-11 min-w-32 cursor-pointer list-none items-center gap-2 rounded-sm border border-[#9cad82] bg-card px-3 text-sm font-bold text-[#506b32] transition-colors hover:border-[#607d35] hover:bg-[#edf3e5] focus-visible:ring-[3px] focus-visible:ring-[#8ba55e]/30 focus-visible:outline-none sm:h-8 sm:px-2 sm:text-[10px] [&::-webkit-details-marker]:hidden"
      >
        {showDomainColors && value && <DomainSwatch domain={value} />}
        <span className="min-w-0 flex-1 truncate">
          {value || `Tất cả ${label.toLocaleLowerCase("vi")}`}
        </span>
        <ChevronDown className="size-3 text-[#607d35] transition-transform group-open:rotate-180" />
      </summary>
      <ResponsiveDropdownPanel
        title={`Chọn ${label}`}
        subtitle={value || `Tất cả ${label.toLocaleLowerCase("vi")}`}
        onClose={() => detailsRef.current?.removeAttribute("open")}
        backdropClassName="z-[105]"
        className="z-[110] border-[#9cad82] ring-1 ring-[#607d35]/10 sm:top-full sm:left-0 sm:mt-1 sm:min-w-full sm:p-1"
        role="dialog"
        aria-label={`Lọc theo ${label.toLocaleLowerCase("vi")}`}
      >
        {allowEmpty && (
          <button
            type="button"
            onClick={() => choose("")}
            className={cn(
              "block min-h-11 w-full rounded-sm px-3 py-2 text-left text-sm font-bold text-[#506b32] hover:bg-[#e4edd8] sm:min-h-0 sm:px-2 sm:py-1.5 sm:text-[10px]",
              !value && "bg-[#edf3e5]",
            )}
          >
            Tất cả {label.toLocaleLowerCase("vi")}
          </button>
        )}
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => choose(option)}
            className={cn(
              "flex min-h-11 w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm font-bold hover:bg-[#e4edd8] sm:min-h-0 sm:px-2 sm:py-1.5 sm:text-[10px]",
              value === option && "bg-[#edf3e5] text-[#506b32]",
            )}
          >
            {showDomainColors && <DomainSwatch domain={option} />}
            {option}
          </button>
        ))}
      </ResponsiveDropdownPanel>
    </details>
  );
}

function DomainSwatch({ domain }: { domain: string }) {
  const color =
    RIFTBOUND_DOMAIN_COLORS[domain as keyof typeof RIFTBOUND_DOMAIN_COLORS];
  return (
    <span
      aria-hidden="true"
      className="size-2.5 shrink-0 rounded-[2px] border border-black/15"
      style={{ backgroundColor: color }}
    />
  );
}
