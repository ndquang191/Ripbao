import { BrandLogo } from "@/components/brand-logo";

export function PageLoading() {
  return (
    <main
      className="paper-grid grid min-h-dvh place-items-center px-5"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4" role="status">
        <div className="relative grid size-16 place-items-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-accent/25 motion-reduce:animate-none" />
          <BrandLogo className="size-12 shadow-lg" />
        </div>
        <div className="text-center">
          <p className="text-xs font-extrabold tracking-[0.2em]">RIPBAO</p>
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            Đang tải dữ liệu...
          </p>
        </div>
        <span className="h-0.5 w-24 overflow-hidden rounded-full bg-secondary">
          <span className="page-loading-bar block h-full w-1/2 rounded-full bg-[#789342]" />
        </span>
      </div>
    </main>
  );
}
