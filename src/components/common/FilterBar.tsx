import { Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SearchField({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative w-full sm:max-w-xs", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/80" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9.5 pl-9 pr-3 rounded-lg border-border/70 bg-card/60"
      />
    </div>
  );
}

export function FilterChips({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/40 backdrop-blur-md">
      {options.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 cursor-pointer whitespace-nowrap select-none",
              active
                ? "bg-card text-foreground shadow-xs border border-border/60 font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-card/40",
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export function EmptyState({
  message,
  title = "No results found",
  action,
}: {
  message: string;
  title?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="surface flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary mb-1">
        <Sparkles className="size-5" />
      </div>
      <p className="font-display text-base font-semibold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
