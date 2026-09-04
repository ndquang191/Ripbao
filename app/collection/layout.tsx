import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

type CollectionLayoutProps = {
  children: React.ReactNode;
};

export default async function CollectionLayout({
  children,
}: CollectionLayoutProps) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.isGuest) notFound();

  return children;
}
