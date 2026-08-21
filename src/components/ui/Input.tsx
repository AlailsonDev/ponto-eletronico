import { forwardRef, type InputHTMLAttributes } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  erro?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, erro, id, className, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="font-body text-sm font-medium text-ink-900">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            "rounded-card border border-surface-border bg-white px-3.5 py-2.5 font-body text-sm text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100",
            erro && "border-red-600 focus:border-red-600 focus:ring-red-100",
            className
          )}
          aria-invalid={!!erro}
          aria-describedby={erro ? `${inputId}-erro` : undefined}
          {...props}
        />
        {erro && (
          <p id={`${inputId}-erro`} className="font-body text-xs text-red-600">
            {erro}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
