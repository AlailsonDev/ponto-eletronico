import { forwardRef, type InputHTMLAttributes } from "react";
import clsx from "clsx";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  descricao?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, descricao, id, className, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex items-start gap-2.5">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className={clsx(
            "mt-0.5 h-4 w-4 shrink-0 rounded border border-surface-border text-teal-600 outline-none transition-colors focus:ring-2 focus:ring-teal-100",
            className
          )}
          {...props}
        />
        <label htmlFor={inputId} className="flex flex-col gap-0.5">
          <span className="font-body text-sm font-medium text-ink-900">{label}</span>
          {descricao && <span className="font-body text-xs text-ink-400">{descricao}</span>}
        </label>
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";
