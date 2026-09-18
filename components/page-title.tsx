import Link from "next/link";
import { ArrowLeft, type LucideIcon } from "lucide-react";

type PageTitleProps = {
  children: React.ReactNode;
  icon?: LucideIcon;
  backHref?: string;
  backLabel?: string;
  className?: string;
};

export function PageTitle({
  children,
  icon: Icon,
  backHref,
  backLabel = "Quay lại",
  className,
}: PageTitleProps) {
  return (
    <div className={className}>
      {backHref && (
        <Link
          href={backHref}
          className="mb-2.5 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground sm:min-h-0 sm:text-xs"
        >
          <ArrowLeft className="size-3.5" /> {backLabel}
        </Link>
      )}
      <h1 className="flex w-fit items-center gap-2.5 font-serif text-[1.65rem] leading-none font-bold tracking-tight text-foreground sm:text-3xl">
        {Icon && (
          <span className="grid size-8 shrink-0 place-items-center rounded-sm border border-[#9cad82]/70 bg-[#edf3e5] text-[#506b32] shadow-sm sm:size-9">
            <Icon className="size-4.5 sm:size-5" aria-hidden="true" />
          </span>
        )}
        {children}
      </h1>
    </div>
  );
}
