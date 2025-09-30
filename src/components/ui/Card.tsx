import { cn } from "@/lib/cn";
import type { HTMLAttributes, ReactNode } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    />
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) {
  return (
    <div
      {...props}
      className={cn("border-b border-slate-100 px-6 py-4", className)}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      {...props}
      className={cn("text-base font-semibold text-slate-900", className)}
    />
  );
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      {...props}
      className={cn("mt-1 text-sm text-slate-500", className)}
    />
  );
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("px-6 py-5", className)} />;
}
