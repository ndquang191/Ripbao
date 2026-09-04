"use client";

import { useId, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { announceDropdownOpen } from "@/lib/dropdown-coordination";
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
  showDomainColors = false,
  allowEmpty = true,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  className?: string;
  showDomainColors?: boolean;
  allowEmpty?: boolean;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const dropdownId = useId();

  const choose = (nextValue: string) => {
    onChange(nextValue);
    detailsRef.current?.removeAttribute("open");
  };

  const closeOtherDropdowns = () => {
    const current = detailsRef.current;
    if (!current?.open) return;
    announceDropdownOpen(dropdownId, current);
  };

  return (
    <details
      ref={detailsRef}
      data-filter-dropdown
      onToggle={closeOtherDropdowns}
      className={cn("group relative z-10 shrink-0 open:z-[100]", className)}
    >
      <summary className="flex h-8 min-w-32 cursor-pointer list-none items-center gap-2 rounded-sm border border-[#9cad82] bg-card px-2 text-[10px] font-bold text-[#506b32] transition-colors hover:border-[#607d35] hover:bg-[#edf3e5] focus-visible:ring-[3px] focus-visible:ring-[#8ba55e]/30 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        {showDomainColors && value && <DomainSwatch domain={value} />}
        <span className="min-w-0 flex-1 truncate">
          {value || `Tất cả ${label.toLocaleLowerCase("vi")}`}
        </span>
        <ChevronDown className="size-3 text-[#607d35] transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute top-full left-0 z-[110] mt-1 min-w-full overflow-hidden rounded-sm border border-[#9cad82] bg-card p-1 shadow-xl ring-1 ring-[#607d35]/10">
        {allowEmpty && (
          <button
            type="button"
            onClick={() => choose("")}
            className={cn(
              "block w-full rounded-sm px-2 py-1.5 text-left text-[10px] font-bold text-[#506b32] hover:bg-[#e4edd8]",
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
              "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[10px] font-bold hover:bg-[#e4edd8]",
              value === option && "bg-[#edf3e5] text-[#506b32]",
            )}
          >
            {showDomainColors && <DomainSwatch domain={option} />}
            {option}
          </button>
        ))}
      </div>
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
