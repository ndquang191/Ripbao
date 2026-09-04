"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import Link from "next/link";
import { Handshake, LibraryBig, LogOut, Settings, X } from "lucide-react";
import { CartLink } from "@/components/cart-link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/cart-provider";
import { useToast } from "@/components/toast";
import {
  announceDropdownOpen,
  DROPDOWN_OPEN_EVENT,
} from "@/lib/dropdown-coordination";

export function AccountLink({ className }: { className?: string }) {
  const { sessionUser, setSessionUser } = useCart();
  const username = sessionUser?.username ?? null;
  const [profileOpen, setProfileOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [displayName, setDisplayName] = useState(
    sessionUser?.displayName ?? "",
  );
  const [facebookUrl, setFacebookUrl] = useState(
    sessionUser?.facebookUrl ?? "",
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const toast = useToast();
  const [pendingTrades, setPendingTrades] = useState(0);
  const accountMenuId = useId();

  useEffect(() => {
    const closeForOtherDropdown = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== accountMenuId)
        setAccountMenuOpen(false);
    };
    document.addEventListener(DROPDOWN_OPEN_EVENT, closeForOtherDropdown);
    return () =>
      document.removeEventListener(DROPDOWN_OPEN_EVENT, closeForOtherDropdown);
  }, [accountMenuId]);

  useEffect(() => {
    if (accountMenuOpen) announceDropdownOpen(accountMenuId);
  }, [accountMenuId, accountMenuOpen]);

  useEffect(() => {
    if (!username) {
      setPendingTrades(0);
      return;
    }
    fetch("/api/trades")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { requests?: Array<{ role: string; status: string }> }) =>
        setPendingTrades(
          (data.requests ?? []).filter(
            (trade) => trade.role === "seller" && trade.status === "pending",
          ).length,
        ),
      )
      .catch(() => setPendingTrades(0));
  }, [username]);

  useEffect(() => {
    if (!profileOpen && !accountMenuOpen && !logoutConfirmOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setProfileOpen(false);
      setAccountMenuOpen(false);
      setLogoutConfirmOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    const shouldLockScroll = profileOpen || logoutConfirmOpen;
    const previousOverflow = document.body.style.overflow;
    if (shouldLockScroll) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      if (shouldLockScroll) document.body.style.overflow = previousOverflow;
    };
  }, [profileOpen, accountMenuOpen, logoutConfirmOpen]);

  const openProfile = () => {
    if (!username) return;
    setPassword("");
    setConfirmPassword("");
    setAccountMenuOpen(false);
    setProfileOpen(true);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setProfileOpen(false);
    setLogoutConfirmOpen(false);
    setSessionUser(null);
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Mật khẩu xác nhận chưa khớp.", variant: "error" });
      return;
    }
    if (!username) return;
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, facebookUrl, password }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok)
      return toast({
        title: data.error ?? "Không thể lưu thông tin.",
        variant: "error",
      });
    setSessionUser({ username, displayName, facebookUrl: facebookUrl || null });
    setPassword("");
    setConfirmPassword("");
    toast({ title: "Đã lưu thông tin.", variant: "success" });
  };

  if (!username) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <CartLink />
        <Link
          href="/login"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  if (sessionUser?.isGuest) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <Link
          href="/trades"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "px-2.5",
          )}
        >
          <Handshake className="size-3.5" />
          Giao dịch
        </Link>
        <CartLink />
        <Link
          href="/login"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className={cn("flex items-center gap-1.5", className)}>
        <Link
          href="/trades"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "relative px-2.5",
          )}
          title="Giao dịch"
        >
          <Handshake className="size-3.5" />
          <span className="hidden xl:inline">Giao dịch</span>
          {pendingTrades > 0 && (
            <span className="absolute -top-1.5 -right-1.5 grid min-w-4.5 h-4.5 place-items-center rounded-full bg-destructive px-1 text-[8px] font-black text-white">
              {pendingTrades}
            </span>
          )}
        </Link>
        <CartLink />
        <div className="relative flex h-8 items-center">
          <button
            type="button"
            onClick={() => setAccountMenuOpen((open) => !open)}
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "group size-8 cursor-pointer overflow-hidden rounded-md p-0 hover:border-primary/50 hover:bg-secondary hover:shadow-md",
            )}
            aria-label={`Mở menu của ${displayName}`}
            aria-expanded={accountMenuOpen}
            title="Tài khoản"
          >
            <img
              src={`https://api.dicebear.com/10.x/critters/svg?scale=0.94&borderRadius=12&seed=${encodeURIComponent(displayName)}`}
              alt=""
              className="size-full object-cover transition-transform duration-200 group-hover:scale-110"
            />
          </button>
          {accountMenuOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setAccountMenuOpen(false)}
                aria-label="Đóng menu tài khoản"
              />
              <div
                className="absolute right-0 top-full z-50 mt-2 w-44 rounded-md border bg-card p-1.5 shadow-xl"
                role="menu"
              >
                <Link
                  href="/collection"
                  onClick={() => setAccountMenuOpen(false)}
                  className="flex h-9 items-center gap-2 rounded-sm px-2.5 text-xs font-bold hover:bg-secondary"
                  role="menuitem"
                >
                  <LibraryBig className="size-3.5" />
                  Collection
                </Link>
                <button
                  type="button"
                  onClick={openProfile}
                  className="flex h-9 w-full items-center gap-2 rounded-sm px-2.5 text-xs font-bold hover:bg-secondary"
                  role="menuitem"
                >
                  <Settings className="size-3.5" />
                  Cài đặt
                </button>
                <div className="my-1 border-t" />
                <button
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    setLogoutConfirmOpen(true);
                  }}
                  className="flex h-9 w-full items-center gap-2 rounded-sm px-2.5 text-xs font-bold text-destructive hover:bg-destructive/10"
                  role="menuitem"
                >
                  <LogOut className="size-3.5" />
                  Đăng xuất
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {logoutConfirmOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-confirm-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-primary/35 backdrop-blur-[1px]"
            onClick={() => setLogoutConfirmOpen(false)}
            aria-label="Huỷ đăng xuất"
          />
          <div className="relative w-full max-w-sm rounded-md border bg-card p-5 shadow-2xl">
            <h2
              id="logout-confirm-title"
              className="font-serif text-lg font-semibold"
            >
              Xác nhận đăng xuất
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Bạn có chắc muốn đăng xuất khỏi Ripbao?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLogoutConfirmOpen(false)}
              >
                Huỷ
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-destructive text-white hover:bg-destructive/85"
                onClick={logout}
              >
                <LogOut className="size-3.5" />
                Đăng xuất
              </Button>
            </div>
          </div>
        </div>
      )}

      {profileOpen && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-drawer-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-primary/35 backdrop-blur-[1px]"
            onClick={() => setProfileOpen(false)}
            aria-label="Đóng profile"
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(92vw,420px)] flex-col border-r bg-card shadow-2xl">
            <div className="flex items-start justify-between border-b px-5 py-5 sm:px-6">
              <div>
                <h2
                  id="profile-drawer-title"
                  className="font-serif text-xl font-semibold"
                >
                  Chỉnh sửa profile
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {displayName}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => setProfileOpen(false)}
                aria-label="Đóng"
              >
                <X className="size-4" />
              </Button>
            </div>
            <form
              className="flex flex-1 flex-col overflow-y-auto p-5 sm:p-6"
              onSubmit={saveProfile}
            >
              <div className="space-y-4">
                <label
                  className="block space-y-2 text-xs font-bold"
                  htmlFor="profile-display-name"
                >
                  Tên hiển thị
                  <Input
                    id="profile-display-name"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Tên của bạn"
                    required
                  />
                </label>
                <label
                  className="block space-y-2 text-xs font-bold"
                  htmlFor="profile-facebook"
                >
                  Link Facebook
                  <Input
                    id="profile-facebook"
                    type="url"
                    value={facebookUrl}
                    onChange={(event) => setFacebookUrl(event.target.value)}
                    placeholder="https://facebook.com/..."
                  />
                </label>
                <div className="border-t pt-4">
                  <p className="mb-3 text-[11px] text-muted-foreground">
                    Để trống nếu bạn không muốn đổi mật khẩu.
                  </p>
                  <div className="space-y-4">
                    <label
                      className="block space-y-2 text-xs font-bold"
                      htmlFor="profile-password"
                    >
                      Mật khẩu
                      <Input
                        id="profile-password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        minLength={6}
                        autoComplete="new-password"
                      />
                    </label>
                    <label
                      className="block space-y-2 text-xs font-bold"
                      htmlFor="profile-confirm-password"
                    >
                      Xác nhận mật khẩu
                      <Input
                        id="profile-confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(event.target.value)
                        }
                        minLength={password ? 6 : undefined}
                        autoComplete="new-password"
                      />
                    </label>
                  </div>
                </div>
              </div>
              <div className="mt-auto pt-6">
                <Button type="submit" className="w-full">
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </>
  );
}
