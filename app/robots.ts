import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ripbao.vercel.app";
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/search", "/u/"],
      disallow: ["/api/", "/cart", "/collection", "/trades"],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
