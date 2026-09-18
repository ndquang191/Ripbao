"use client";

import { type ComponentProps, useId } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ResponsiveDropdownPanelProps = Omit<
  ComponentProps<"div">,
  "title"
> & {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  onClose: () => void;
  backdropClassName?: string;
  showDesktopHeader?: boolean;
};

export function ResponsiveDropdownPanel({
  title,
  subtitle,
  onClose,
  backdropClassName,
  showDesktopHeader = false,
  className,
  children,
  ...props
}: ResponsiveDropdownPanelProps) {
  const titleId = useId();

  return (
    <>
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        className={cn("fixed inset-0 z-40 bg-black/30 sm:hidden", backdropClassName)}
        onClick={onClose}
      />
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 max-h-[min(85dvh,42rem)] overflow-y-auto overscroll-contain rounded-t-lg border bg-card p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] shadow-2xl",
          "sm:absolute sm:inset-x-auto sm:bottom-auto sm:max-h-none sm:overflow-visible sm:overscroll-auto sm:rounded-sm sm:shadow-xl",
          className,
        )}
        aria-labelledby={props["aria-label"] ? undefined : titleId}
        {...props}
      >
        <div
          className={cn(
            "sticky -top-3 z-10 -mx-3 mb-2 flex min-h-12 items-center justify-between gap-3 border-b bg-card px-3 py-2",
            showDesktopHeader
              ? "sm:static sm:mx-0 sm:min-h-0 sm:border-0 sm:px-0 sm:pt-0"
              : "sm:hidden",
          )}
        >
          <div className="min-w-0">
            <strong id={titleId} className="block truncate text-sm sm:text-xs">
              {title}
            </strong>
            {subtitle && (
              <span className="block truncate text-[10px] text-muted-foreground">
                {subtitle}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 shrink-0 place-items-center rounded-sm text-muted-foreground hover:bg-secondary hover:text-foreground sm:hidden"
            aria-label="Đóng"
          >
            <X className="size-3.5" />
          </button>
        </div>
        {children}
      </div>
    </>
  );
}
