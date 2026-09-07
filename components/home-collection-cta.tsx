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
      <CardContent className="flex items-center justify-between gap-5 p-3.5">
        <div>
          <strong className="text-sm">
            {isLoggedIn
              ? "Thêm card bạn muốn giao dịch"
              : "Bạn cũng có một bộ sưu tập?"}
          </strong>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {isLoggedIn
              ? "Cập nhật collection để mọi người tìm thấy card của bạn."
              : "Tạo trang riêng và chia sẻ card của bạn."}
          </p>
        </div>
        <Link
          href={isLoggedIn ? "/collection" : "/register"}
          className={cn(
            buttonVariants({ variant: "accent", size: "sm" }),
            "shrink-0",
          )}
        >
          {isLoggedIn ? "Thêm card" : "Tạo miễn phí"}
          <ArrowUpRight className="size-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}
