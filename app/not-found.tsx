import Link from "next/link";
import { Home, SearchX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="paper-grid grid min-h-dvh place-items-center px-5 py-8">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardContent className="p-8 sm:p-10">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-secondary text-primary"><SearchX className="size-6" /></span>
          <p className="mt-5 text-[10px] font-extrabold tracking-[0.18em] text-muted-foreground uppercase">404 · Không tìm thấy</p>
          <h1 className="mt-2 font-serif text-2xl font-semibold">Trang này không tồn tại</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Đường dẫn có thể không còn tồn tại hoặc bạn không có quyền truy cập nội dung này.</p>
          <Link href="/" className={`${buttonVariants()} mt-6`}><Home className="size-4" /> Quay lại homepage</Link>
        </CardContent>
      </Card>
    </main>
  );
}
