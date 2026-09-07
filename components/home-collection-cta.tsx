"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function HomeCollectionCta() {
  const { sessionUser } = useCart();
  const isLoggedIn = Boolean(sessionUser && !sessionUser.isGuest);

  return (
    <Card className="mt-2.5 border-dashed bg-secondary/75">
      <CardContent className="flex items-center justify-between gap-3 p-3 sm:gap-5 sm:p-3.5">
        <div className="min-w-0">
          <strong className="block text-sm leading-5 sm:hidden">
            {isLoggedIn ? "Bộ sưu tập của bạn" : "Tạo bộ sưu tập"}
          </strong>
          <strong className="hidden text-sm sm:inline">
            {isLoggedIn
              ? "Thêm card bạn muốn giao dịch"
              : "Bạn cũng có một bộ sưu tập?"}
          </strong>
          <p className="mt-0.5 hidden text-[10px] text-muted-foreground sm:block">
            {isLoggedIn
              ? "Cập nhật collection để mọi người tìm thấy card của bạn."
              : "Tạo trang riêng và chia sẻ card của bạn."}
          </p>
        </div>
        <Link
          href={isLoggedIn ? "/collection" : "/register"}
          className={cn(
            buttonVariants({ variant: "accent", size: "sm" }),
            "h-11 shrink-0 sm:h-8",
          )}
        >
          {isLoggedIn ? "Thêm card" : "Tạo miễn phí"}
          <ArrowUpRight className="hidden size-3.5 sm:block" />
        </Link>
      </CardContent>
    </Card>
  );
}
