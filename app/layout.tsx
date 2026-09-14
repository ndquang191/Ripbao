import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { ToastProvider } from "@/components/toast";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ripbao.vercel.app";

export const metadata: Metadata = {
  applicationName: "Ripbao",
  title: {
    default: "Ripbao",
    template: "%s · Ripbao",
  },
  description:
    "Khám phá, mua bán và chia sẻ bộ sưu tập card Riftbound trên Ripbao.",
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/" },
  keywords: ["Riftbound", "card", "TCG", "marketplace", "collection"],
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "Ripbao",
    title: "Ripbao",
    description:
      "Khám phá, mua bán và chia sẻ bộ sưu tập card Riftbound trên Ripbao.",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "Ripbao",
    description:
      "Khám phá, mua bán và chia sẻ bộ sưu tập card Riftbound trên Ripbao.",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className="mobile-type-scale">
        <ToastProvider>
          <CartProvider>{children}</CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
