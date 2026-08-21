import clsx from "clsx";
import { Users, Utensils, UserX, Clock } from "lucide-react";
import type { ContadoresDashboard } from "@/lib/statusFuncionarioHoje";

export function CardsResumoAdmin({ contadores }: { contadores: ContadoresDashboard }) {
  const itens = [
    {
      rotulo: "Trabalhando agora",
      valor: contadores.trabalhando,
      Icone: Users,
      cor: "teal" as const,
    },
    {
      rotulo: "Em almoço",
      valor: contadores.emAlmoco,
      Icone: Utensils,
      cor: "neutral" as const,
    },
    {
      rotulo: "Ausentes",
      valor: contadores.ausentes,
      Icone: UserX,
      cor: "neutral" as const,
    },
    {
      rotulo: "Atrasados",
      valor: contadores.atrasados,
      Icone: Clock,
      cor: contadores.atrasados > 0 ? ("amber" as const) : ("neutral" as const),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {itens.map((item) => (
        <div
          key={item.rotulo}
          className={clsx(
            "rounded-card border p-5",
            item.cor === "teal" && "border-teal-500/20 bg-teal-100",
            item.cor === "amber" && "border-amber-600/20 bg-amber-100",
            item.cor === "neutral" && "border-surface-border bg-white"
          )}
        >
          <item.Icone
            className={clsx(
              "mb-2 h-5 w-5",
              item.cor === "teal" && "text-teal-600",
              item.cor === "amber" && "text-amber-600",
              item.cor === "neutral" && "text-ink-400"
            )}
          />
          <p className="font-mono text-3xl tabular-nums text-navy-800">{item.valor}</p>
          <p className="font-body text-xs font-medium text-ink-600">{item.rotulo}</p>
        </div>
      ))}
    </div>
  );
}
