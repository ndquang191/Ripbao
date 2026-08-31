"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { LibraryBig, LogOut, UserRound, X } from "lucide-react";
import { CartLink } from "@/components/cart-link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const sessionKey = "ripbao.username";
const profileKey = (username: string) => `ripbao.profile.${username}`;

export type StoredProfile = { displayName: string; password?: string; facebookUrl: string };

export function getStoredProfile(username: string): StoredProfile | null {
  try {
    const value = window.localStorage.getItem(profileKey(username));
    return value ? JSON.parse(value) as StoredProfile : null;
  } catch {
    return null;
  }
}

export function AccountLink({ className }: { className?: string }) {
  const [username, setUsername] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => { setUsername(window.localStorage.getItem(sessionKey)); }, []);

  useEffect(() => {
    if (!profileOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setProfileOpen(false);
    document.addEventListener("keydown", closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [profileOpen]);

  const openProfile = () => {
    if (!username) return;
    const profile = getStoredProfile(username);
    setDisplayName(profile?.displayName ?? username);
    setFacebookUrl(profile?.facebookUrl ?? "");
    setPassword("");
    setConfirmPassword("");
    setMessage("");
    setProfileOpen(true);
  };

  const logout = () => {
    window.localStorage.removeItem(sessionKey);
    setProfileOpen(false);
    setUsername(null);
  };

  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Mật khẩu xác nhận chưa khớp.");
      return;
    }
    if (!username) return;
    const current = getStoredProfile(username);
    window.localStorage.setItem(profileKey(username), JSON.stringify({
      displayName: displayName.trim(),
      facebookUrl: facebookUrl.trim(),
      password: password || current?.password,
    } satisfies StoredProfile));
    setPassword("");
    setConfirmPassword("");
    setMessage("Đã lưu thông tin.");
  };

  if (!username) {
    return <div className={cn("flex items-center gap-1.5", className)}><CartLink /><Link href="/login" className={buttonVariants({ variant: "outline", size: "sm" })}>Đăng nhập</Link></div>;
  }

  return (
    <>
      <div className={cn("flex items-center gap-1.5", className)}>
        <Link href="/collection/new" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "px-2.5")} title="Collections"><LibraryBig className="size-3.5" /><span className="hidden xl:inline">Collections</span></Link>
        <CartLink />
        <button type="button" onClick={openProfile} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "px-2.5")} aria-label="Chỉnh sửa profile" title="Profile"><UserRound className="size-3.5" /><span className="hidden xl:inline">Profile</span></button>
        <button type="button" onClick={logout} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "px-2.5 text-muted-foreground hover:text-destructive")} aria-label="Đăng xuất" title="Logout"><LogOut className="size-3.5" /><span className="hidden xl:inline">Logout</span></button>
      </div>

      {profileOpen && <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="profile-drawer-title">
        <button type="button" className="absolute inset-0 bg-primary/35 backdrop-blur-[1px]" onClick={() => setProfileOpen(false)} aria-label="Đóng profile" />
        <aside className="absolute inset-y-0 left-0 flex w-[min(92vw,420px)] flex-col border-r bg-card shadow-2xl">
          <div className="flex items-start justify-between border-b px-5 py-5 sm:px-6"><div><h2 id="profile-drawer-title" className="font-serif text-xl font-semibold">Chỉnh sửa profile</h2><p className="mt-1 text-xs text-muted-foreground">@{username}</p></div><Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => setProfileOpen(false)} aria-label="Đóng"><X className="size-4" /></Button></div>
          <form className="flex flex-1 flex-col overflow-y-auto p-5 sm:p-6" onSubmit={saveProfile} onChange={() => message && setMessage("")}>
            <div className="space-y-4">
              <label className="block space-y-2 text-xs font-bold" htmlFor="profile-display-name">Tên hiển thị<Input id="profile-display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Tên của bạn" required /></label>
              <label className="block space-y-2 text-xs font-bold" htmlFor="profile-facebook">Link Facebook<Input id="profile-facebook" type="url" value={facebookUrl} onChange={(event) => setFacebookUrl(event.target.value)} placeholder="https://facebook.com/..." /></label>
              <div className="border-t pt-4"><p className="mb-3 text-[11px] text-muted-foreground">Để trống nếu bạn không muốn đổi mật khẩu.</p><div className="space-y-4">
                <label className="block space-y-2 text-xs font-bold" htmlFor="profile-password">Mật khẩu<Input id="profile-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} autoComplete="new-password" /></label>
                <label className="block space-y-2 text-xs font-bold" htmlFor="profile-confirm-password">Xác nhận mật khẩu<Input id="profile-confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={password ? 6 : undefined} autoComplete="new-password" /></label>
              </div></div>
            </div>
            <div className="mt-auto pt-6">{message && <p className={cn("mb-3 text-xs font-semibold", message.startsWith("Đã") ? "text-[#5f793f]" : "text-destructive")} role="status">{message}</p>}<Button type="submit" className="w-full">Lưu thay đổi</Button></div>
          </form>
        </aside>
      </div>}
    </>
  );
}

export { sessionKey };
