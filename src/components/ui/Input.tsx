import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-full border border-slate-300 bg-white px-4 text-sm text-slate-700 shadow-sm transition focus:border-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100",
        className,
      )}
      {...props}
    />
  );
});
