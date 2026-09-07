import Link from "next/link";
import { AccountLink } from "@/components/account-link";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

export function SiteHeader({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        "flex items-center justify-between border-b pb-5",
        "max-sm:gap-3 max-sm:pb-4",
        className,
      )}
    >
      <Link
        href="/"
        className={cn(
          "flex items-center gap-3 text-sm font-extrabold tracking-[0.16em]",
          "max-sm:min-h-11 max-sm:shrink-0 max-sm:gap-2 max-sm:text-xs max-sm:tracking-[0.1em]",
        )}
      >
        <BrandLogo /> RIPBAO
      </Link>
      <AccountLink />
    </header>
  );
}
