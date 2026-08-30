"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const sessionKey = "ripbao.username";

export function AccountLink({ className }: { className?: string }) {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    setUsername(window.localStorage.getItem(sessionKey));
  }, []);

  if (!username) {
    return (
      <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }), className)}>
        Đăng nhập
      </Link>
    );
  }

  return (
    <Link
      href={`/u/${encodeURIComponent(username)}`}
      className={cn(buttonVariants({ variant: "outline", size: "sm" }), className)}
      title={`Trang cá nhân của @${username}`}
    >
      <UserRound className="size-3.5" />
      @{username}
    </Link>
  );
}

export { sessionKey };
