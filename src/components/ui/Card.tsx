import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        "card relative overflow-hidden p-5 transition-shadow",
        "hover:shadow-elevated",
        className,
      )}
      {...rest}
    />
  ),
);
Card.displayName = "Card";

export function CardTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-sm font-medium tracking-wide text-text-muted uppercase", className)}
      {...rest}
    />
  );
}

export function CardSection({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-3", className)} {...rest} />;
}
