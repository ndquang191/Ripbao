"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type SessionUser, useCart } from "@/components/cart-provider";

export default function LoginPage() {
  const router = useRouter();
  const { setSessionUser } = useCart();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const username = String(form.get("username") ?? "").trim();
    const password = String(form.get("password") ?? "");

    setSubmitting(true);
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
    const data = await response.json() as { error?: string; user?: SessionUser };
    setSubmitting(false);
    if (!response.ok || !data.user) return setError(data.error ?? "Không thể đăng nhập.");
    setSessionUser(data.user);
    router.push(`/u/${data.user.username}`);
    router.refresh();
  }

  return (
    <main className="paper-grid relative grid h-[100svh] place-items-center overflow-hidden px-5 py-4 sm:py-6">
      <div className="pointer-events-none absolute -top-28 -right-24 size-80 rounded-full bg-accent/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full bg-[#cadde2]/45 blur-3xl" />

      <div className="login-panel relative w-full max-w-[420px]">
        <Card className="border-primary/15 bg-card/95 shadow-[0_24px_70px_rgba(29,58,43,.12)] backdrop-blur-sm">
          <CardContent className="login-card-content p-5 sm:p-7">
            <Link href="/" className="login-brand mb-5 flex w-fit items-center gap-3 text-sm font-extrabold tracking-[0.16em] sm:mb-6">
              <span className="relative block h-9 w-8 rounded-sm border-2 border-accent bg-primary shadow-sm">
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-serif text-lg leading-none text-accent">
                  R
                </span>
              </span>
              RIPBAO
            </Link>

            <form className="login-form flex flex-col gap-4" onSubmit={handleSubmit} onChange={() => error && setError("")}>
              <div className="flex flex-col gap-2.5">
                <label htmlFor="username" className="block text-xs font-bold">
                  Username
                </label>
                <Input
                  id="username"
                  name="username"
                  autoComplete="username"
                  placeholder="bao.collects"
                  required
                  className="h-12 bg-background/70 text-base sm:text-sm"
                  aria-describedby={error ? "login-error" : undefined}
                />
              </div>

              <div className="flex flex-col gap-2.5">
                <label htmlFor="password" className="block text-xs font-bold">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Nhập password"
                    required
                    className="h-12 bg-background/70 pr-11 text-base sm:text-sm"
                    aria-describedby={error ? "login-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute top-1/2 right-3 grid size-7 -translate-y-1/2 place-items-center text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? "Ẩn password" : "Hiện password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p id="login-error" role="alert" className="text-xs font-semibold text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" className="h-12 w-full" disabled={submitting}>
                {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
                <ArrowRight className="size-4" />
              </Button>
            </form>

          </CardContent>
        </Card>

        <p className="login-register mt-4 text-center text-[10px] text-muted-foreground sm:mt-5">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-bold text-foreground underline underline-offset-4">
            Tạo miễn phí
          </Link>
        </p>
      </div>
    </main>
  );
}
