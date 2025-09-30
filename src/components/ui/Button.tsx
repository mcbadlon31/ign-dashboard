import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const variantStyles: Record<Variant, string> = {
  primary: "bg-slate-900 text-white hover:bg-slate-800 focus-visible:outline-slate-900",
  secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:outline-slate-300",
  outline:
    "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-slate-300",
  ghost: "text-slate-700 hover:bg-slate-100 focus-visible:outline-slate-300",
  danger: "bg-rose-600 text-white hover:bg-rose-500 focus-visible:outline-rose-600",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
});
