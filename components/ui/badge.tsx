import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase",
  {
    variants: {
      variant: {
        default: "border-[#30363d] bg-[#1f6feb]/10 text-[#58a6ff]",
        success: "border-[#2ea043]/40 bg-[#2ea043]/10 text-[#3fb950]",
        warning: "border-[#bb8009]/40 bg-[#bb8009]/10 text-[#d29922]"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
