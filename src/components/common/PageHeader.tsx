import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="relative mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-border/40 pb-5">
      <div className="max-w-3xl">
        {eyebrow && (
          <div className="mb-2 flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              {eyebrow}
            </p>
          </div>
        )}
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-[2rem] leading-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 sm:pt-0">{actions}</div>
      )}
    </div>
  );
}
