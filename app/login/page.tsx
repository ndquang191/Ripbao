"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getStoredProfile, sessionKey } from "@/components/account-link";

const demoAccount = {
  username: "bao.collects",
  password: "ripbao",
};

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const username = String(form.get("username") ?? "").trim();
    const password = String(form.get("password") ?? "");

    const savedPassword = getStoredProfile(username)?.password;
    if (username !== demoAccount.username || password !== (savedPassword ?? demoAccount.password)) {
      setError("Username hoặc password chưa đúng.");
      return;
    }

    window.localStorage.setItem(sessionKey, username);
    router.push(`/u/${username}`);
  }

  return (
    <main className="paper-grid relative grid h-[100vh] place-items-center overflow-hidden px-5 py-4 sm:py-6">
      <div className="pointer-events-none absolute -top-28 -right-24 size-80 rounded-full bg-accent/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full bg-[#cadde2]/45 blur-3xl" />

      <div className="login-panel relative w-full max-w-[420px]">
        <Link
          href="/"
          className="login-back mb-4 inline-flex items-center gap-2 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground sm:mb-5"
        >
          <ArrowLeft className="size-3.5" />
          Về trang chủ
        </Link>

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

            <form className="login-form space-y-4" onSubmit={handleSubmit} onChange={() => error && setError("")}>
              <div className="space-y-2">
                <label htmlFor="username" className="text-xs font-bold">
                  Username
                </label>
                <Input
                  id="username"
                  name="username"
                  autoComplete="username"
                  placeholder="bao.collects"
                  required
                  className="h-12 bg-background/70"
                  aria-describedby={error ? "login-error" : undefined}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-xs font-bold">
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
                    className="h-12 bg-background/70 pr-11"
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

              <Button type="submit" className="h-12 w-full">
                Đăng nhập
                <ArrowRight className="size-4" />
              </Button>
            </form>

            <div className="login-demo mt-5 rounded-md border border-dashed bg-secondary/65 px-4 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
              Tài khoản demo: <strong className="text-foreground">bao.collects</strong> /{" "}
              <strong className="text-foreground">ripbao</strong>
            </div>
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
