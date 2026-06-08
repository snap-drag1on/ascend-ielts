import { type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-10 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="grid size-12 place-items-center rounded-2xl bg-surface-muted text-text-muted">
          {icon}
        </div>
      ) : null}
      <div>
        <div className="font-display text-base font-semibold text-text">{title}</div>
        {description ? (
          <p className="mt-1 max-w-sm text-sm text-text-muted">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
