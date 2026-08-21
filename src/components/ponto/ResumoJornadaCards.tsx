import clsx from "clsx";
import type { ResumoJornadaDia } from "@/types/registroPonto";
import { formatarMinutos } from "@/lib/formatadores";

export function ResumoJornadaCards({ resumo }: { resumo: ResumoJornadaDia }) {
  const itens = [
    { rotulo: "Horas trabalhadas", valor: formatarMinutos(resumo.minutosTrabalhados), destaque: false },
    { rotulo: "Intervalo", valor: formatarMinutos(resumo.minutosIntervalo), destaque: false },
    {
      rotulo: "Atraso",
      valor: formatarMinutos(resumo.minutosAtraso),
      destaque: !!resumo.minutosAtraso && resumo.minutosAtraso > 0,
      cor: "amber" as const,
    },
    {
      rotulo: "Hora extra",
      valor: formatarMinutos(resumo.minutosHoraExtra),
      destaque: !!resumo.minutosHoraExtra && resumo.minutosHoraExtra > 0,
      cor: "teal" as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {itens.map((item) => (
        <div
          key={item.rotulo}
          className={clsx(
            "rounded-card border p-4",
            item.destaque && item.cor === "amber" && "border-amber-600/20 bg-amber-100",
            item.destaque && item.cor === "teal" && "border-teal-500/20 bg-teal-100",
            !item.destaque && "border-surface-border bg-white"
          )}
        >
          <p className="font-body text-xs font-medium text-ink-600">{item.rotulo}</p>
          <p className="mt-1 font-mono text-xl tabular-nums text-navy-800">{item.valor}</p>
        </div>
      ))}
    </div>
  );
}
