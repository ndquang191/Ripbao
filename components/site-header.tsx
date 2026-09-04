import Link from "next/link";
import { AccountLink } from "@/components/account-link";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

export function SiteHeader({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        "flex items-center justify-between border-b pb-5",
        className,
      )}
    >
      <Link
        href="/"
        className="flex items-center gap-3 text-sm font-extrabold tracking-[0.16em]"
      >
        <BrandLogo /> RIPBAO
      </Link>
      <AccountLink />
    </header>
  );
}
