"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BrandLogo } from "@/components/brand-logo";
import { Input } from "@/components/ui/input";
import { type SessionUser, useCart } from "@/components/cart-provider";

export default function RegisterPage() {
  const router = useRouter();
  const { setSessionUser } = useCart();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== String(form.get("confirmPassword") ?? ""))
      return setError("Mật khẩu xác nhận chưa khớp.");
    setSubmitting(true);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.get("username"),
        displayName: form.get("displayName"),
        facebookUrl: form.get("facebookUrl"),
        password,
      }),
    });
    const data = (await response.json()) as {
      error?: string;
      user?: SessionUser;
    };
    setSubmitting(false);
    if (!response.ok || !data.user)
      return setError(data.error ?? "Không thể tạo tài khoản.");
    setSessionUser(data.user);
    const requestedNext = new URLSearchParams(window.location.search).get(
      "next",
    );
    const next =
      requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
        ? requestedNext
        : `/u/${data.user.username}`;
    router.push(next);
    router.refresh();
  }

  return (
    <main className="paper-grid grid min-h-[100svh] place-items-center px-5 py-8">
      <div className="w-full max-w-[460px]">
        <Link
          href="/login"
          className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-muted-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Đăng nhập
        </Link>
        <Card>
          <CardContent className="p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <Link href="/" aria-label="Về trang chủ" className="shrink-0">
                <BrandLogo className="size-8" />
              </Link>
              <h1 className="font-serif text-xl font-semibold">
                Tạo tài khoản
              </h1>
            </div>
            <form
              onSubmit={handleSubmit}
              onChange={() => error && setError("")}
              className="mt-4 flex flex-col gap-3"
            >
              <label className="flex flex-col gap-1.5 text-xs font-bold">
                Username
                <Input
                  className="text-base sm:text-sm"
                  name="username"
                  required
                  minLength={3}
                  maxLength={32}
                  pattern="[a-z0-9._]+"
                  autoComplete="username"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-bold">
                Tên hiển thị
                <Input
                  className="text-base sm:text-sm"
                  name="displayName"
                  required
                  autoComplete="name"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-bold">
                Facebook
                <Input
                  className="text-base sm:text-sm"
                  name="facebookUrl"
                  type="url"
                  placeholder="https://facebook.com/..."
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-bold">
                Mật khẩu
                <Input
                  className="text-base sm:text-sm"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-bold">
                Xác nhận mật khẩu
                <Input
                  className="text-base sm:text-sm"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </label>
              {error && (
                <p
                  role="alert"
                  className="text-xs font-semibold text-destructive"
                >
                  {error}
                </p>
              )}
              <Button
                type="submit"
                className="h-11 w-full"
                disabled={submitting}
              >
                {submitting ? "Đang tạo..." : "Tạo tài khoản"}
                <ArrowRight className="size-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
