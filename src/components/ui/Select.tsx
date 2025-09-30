import { forwardRef, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        "h-10 w-full rounded-full border border-slate-300 bg-white px-4 text-sm text-slate-700 shadow-sm transition focus:border-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
