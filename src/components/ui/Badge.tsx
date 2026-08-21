import clsx from "clsx";

type CorBadge = "green" | "amber" | "red" | "neutral";

interface BadgeProps {
  cor: CorBadge;
  children: React.ReactNode;
}

const ESTILOS: Record<CorBadge, string> = {
  green: "bg-green-100 text-green-600",
  amber: "bg-amber-100 text-amber-600",
  red: "bg-red-100 text-red-600",
  neutral: "bg-surface text-ink-600",
};

export function Badge({ cor, children }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 font-body text-xs font-medium",
        ESTILOS[cor]
      )}
    >
      {children}
    </span>
  );
}
