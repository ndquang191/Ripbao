import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type EmptyStateProps = React.PropsWithChildren<{
  icon: LucideIcon;
  title: string;
  description?: React.ReactNode;
  variant?: "default" | "error";
  className?: string;
}>;

export function EmptyState({
  icon: Icon,
  title,
  description,
  variant = "default",
  className,
  children,
}: EmptyStateProps) {
  return (
    <Card
      className={cn(
        "flex items-center justify-center border-dashed bg-card/70",
        className,
      )}
    >
      <CardContent className="w-full p-8 text-center sm:p-10">
        <Icon
          className={cn(
            "mx-auto size-8 text-muted-foreground",
            variant === "error" && "text-destructive",
          )}
          aria-hidden="true"
        />
        <h2 className="mt-3 font-serif text-lg font-semibold">{title}</h2>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
