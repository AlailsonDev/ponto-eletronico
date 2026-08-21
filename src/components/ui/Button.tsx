import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  carregando?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", carregando, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || carregando}
        className={clsx(
          "inline-flex items-center justify-center gap-2 rounded-card px-4 py-3 font-body text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:opacity-60",
          variant === "primary" && "bg-navy-800 text-white hover:bg-navy-700",
          variant === "secondary" &&
            "border border-surface-border bg-white text-ink-900 hover:bg-surface",
          variant === "ghost" && "text-navy-800 hover:bg-surface",
          className
        )}
        {...props}
      >
        {carregando && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
