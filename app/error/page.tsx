import Link from "next/link";
import { AlertTriangle, Home } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ErrorPage() {
  return (
    <main className="paper-grid grid min-h-dvh place-items-center px-5 py-8">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardContent className="p-8 sm:p-10">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" />
          </span>
          <p className="mt-5 text-[10px] font-extrabold tracking-[0.18em] text-muted-foreground uppercase">
            Có lỗi xảy ra
          </p>
          <h1 className="mt-2 font-serif text-2xl font-semibold">
            Ripbao chưa thể tải trang này
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Hệ thống đang gặp sự cố tạm thời. Bạn có thể quay lại trang chủ và
            thử lại sau.
          </p>
          <Link href="/" className={`${buttonVariants()} mt-6`}>
            <Home className="size-4" /> Quay lại homepage
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
