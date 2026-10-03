import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-medium tracking-tight transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/12 text-primary font-semibold hover:bg-primary/20",
        secondary: "border-border/60 bg-muted/60 text-muted-foreground hover:bg-muted",
        destructive:
          "border-destructive/20 bg-destructive/12 text-destructive font-semibold hover:bg-destructive/20",
        success: "border-success/20 bg-success/12 text-success font-semibold hover:bg-success/20",
        warning:
          "border-warning/30 bg-warning/15 text-warning-foreground font-semibold hover:bg-warning/25",
        outline: "border-border bg-card/50 text-foreground/80 hover:bg-card hover:text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
