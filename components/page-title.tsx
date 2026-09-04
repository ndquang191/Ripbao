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
          className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> {backLabel}
        </Link>
      )}
      <h1 className="flex items-center gap-2 font-serif text-2xl font-semibold text-[#5f793f]">
        {Icon && <Icon className="size-6 shrink-0" aria-hidden="true" />}
        {children}
      </h1>
    </div>
  );
}
