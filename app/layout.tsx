import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { ToastProvider } from "@/components/toast";

export const metadata: Metadata = {
  title: "Ripbao — Riftbound Card Market",
  description: "Khám phá, định giá và chia sẻ bộ sưu tập Riftbound của bạn.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body><ToastProvider><CartProvider>{children}</CartProvider></ToastProvider></body>
    </html>
  );
}
