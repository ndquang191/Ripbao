"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useCart } from "@/components/cart-provider";
import { cn } from "@/lib/utils";

export function CartLink({ className }: { className?: string }) {
  const { count } = useCart();
  return (
    <Link href="/cart" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "relative", className)} aria-label={`Giỏ hàng, ${count} card`}>
      <ShoppingBag className="size-3.5" />
      <span className="hidden sm:inline">Giỏ hàng</span>
      {count > 0 && <span className="absolute -top-2 -right-2 grid size-5 place-items-center rounded-full border-2 border-background bg-accent text-[9px] font-black leading-none text-accent-foreground shadow-sm">{count > 99 ? "99+" : count}</span>}
    </Link>
  );
}
