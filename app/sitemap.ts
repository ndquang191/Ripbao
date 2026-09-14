import type { MetadataRoute } from "next";
import { getDb } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ripbao.vercel.app";
  const staticPages: MetadataRoute.Sitemap = [
    { url: origin, changeFrequency: "daily", priority: 1 },
    { url: `${origin}/search`, changeFrequency: "daily", priority: 0.8 },
  ];

  try {
    const sql = getDb();
    const sellers = await sql`
      SELECT users.username, max(listings.updated_at) AS "updatedAt"
      FROM users
      JOIN listings ON listings.user_id = users.id
      WHERE NOT users.is_guest AND listings.is_active AND listings.quantity > 0
      GROUP BY users.id
    `;
    return [
      ...staticPages,
      ...sellers.map((seller) => ({
        url: `${origin}/u/${encodeURIComponent(String(seller.username))}`,
        lastModified: new Date(String(seller.updatedAt)),
        changeFrequency: "daily" as const,
        priority: 0.7,
      })),
    ];
  } catch {
    return staticPages;
  }
}
