"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
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
    <main className="paper-grid auth-page relative grid min-h-[100svh] place-items-center overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute -top-28 -right-24 size-80 rounded-full bg-accent/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full bg-[#cadde2]/45 blur-3xl" />

      <div className="auth-panel relative w-full max-w-[460px]">
        <Card className="auth-card border-primary/15 bg-card/95 shadow-[0_24px_70px_rgba(29,58,43,.12)] backdrop-blur-sm">
          <CardContent className="auth-card-content p-5 sm:p-7">
            <Link
              href="/"
              className="auth-brand mb-5 flex w-fit items-center gap-3 text-sm font-extrabold tracking-[0.16em] sm:mb-6"
            >
              <BrandLogo />
              RIPBAO
            </Link>
            <h1 className="font-serif text-xl font-semibold sm:text-2xl">
              Tạo tài khoản
            </h1>
            <p className="mt-1 hidden text-xs leading-5 text-muted-foreground sm:block">
              Tạo hồ sơ để lưu bộ sưu tập và trao đổi card.
            </p>
            <form
              onSubmit={handleSubmit}
              onChange={() => error && setError("")}
              className="auth-form mt-5 flex flex-col gap-3.5"
            >
              <label className="flex flex-col gap-1.5 text-xs font-bold">
                Username
                <Input
                  className="h-11 bg-background/70 text-base sm:text-sm"
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
                  className="h-11 bg-background/70 text-base sm:text-sm"
                  name="displayName"
                  required
                  autoComplete="name"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-bold">
                Facebook
                <Input
                  className="h-11 bg-background/70 text-base sm:text-sm"
                  name="facebookUrl"
                  type="url"
                  placeholder="https://facebook.com/..."
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-bold">
                Mật khẩu
                <Input
                  className="h-11 bg-background/70 text-base sm:text-sm"
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
                  className="h-11 bg-background/70 text-base sm:text-sm"
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
        <p className="auth-switch mt-4 text-center text-xs text-muted-foreground sm:mt-5">
          Đã có tài khoản?{" "}
          <Link
            href="/login"
            className="font-bold text-foreground underline underline-offset-4"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </main>
  );
}
