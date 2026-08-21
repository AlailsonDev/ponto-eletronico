import { forwardRef, type SelectHTMLAttributes } from "react";
import clsx from "clsx";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  erro?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, erro, id, className, children, ...props }, ref) => {
    const selectId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={selectId} className="font-body text-sm font-medium text-ink-900">
          {label}
        </label>
        <select
          ref={ref}
          id={selectId}
          className={clsx(
            "rounded-card border border-surface-border bg-white px-3.5 py-2.5 font-body text-sm text-ink-900 outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-100",
            erro && "border-red-600 focus:border-red-600 focus:ring-red-100",
            className
          )}
          aria-invalid={!!erro}
          {...props}
        >
          {children}
        </select>
        {erro && <p className="font-body text-xs text-red-600">{erro}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
