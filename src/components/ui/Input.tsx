import { type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-9 w-full rounded-lg border border-border-subtle bg-surface-muted px-3 text-sm text-text",
        "placeholder:text-text-faint",
        "focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20",
        "transition-colors",
        className,
      )}
      {...rest}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...rest }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-border-subtle bg-surface-muted px-3 py-2 text-sm text-text",
        "placeholder:text-text-faint",
        "focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20",
        "transition-colors resize-y",
        className,
      )}
      {...rest}
    />
  ),
);
Textarea.displayName = "Textarea";
