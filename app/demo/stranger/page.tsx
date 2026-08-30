import SellerPage from "@/app/u/[username]/page";

export default async function StrangerCollectionDemo() {
  return SellerPage({ params: Promise.resolve({ username: "minhcards" }) });
}
