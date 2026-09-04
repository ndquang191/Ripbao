import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { ToastProvider } from "@/components/toast";

export const metadata: Metadata = {
  applicationName: "Ripbao",
  title: {
    default: "Ripbao",
    template: "%s · Ripbao",
  },
  description: "Khám phá, mua bán và chia sẻ bộ sưu tập card Riftbound trên Ripbao.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body><ToastProvider><CartProvider>{children}</CartProvider></ToastProvider></body>
    </html>
  );
}
