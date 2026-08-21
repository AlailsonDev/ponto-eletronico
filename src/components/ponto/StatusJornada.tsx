import { LogIn, Utensils, RotateCcw, LogOut } from "lucide-react";
import clsx from "clsx";
import type { ResumoJornadaDia } from "@/types/registroPonto";
import { formatarHorario } from "@/lib/formatadores";

const MARCOS = [
  { chave: "entrada" as const, rotulo: "ENTRADA", Icone: LogIn },
  { chave: "saidaAlmoco" as const, rotulo: "ALMOÇO", Icone: Utensils },
  { chave: "retornoAlmoco" as const, rotulo: "RETORNO", Icone: RotateCcw },
  { chave: "saida" as const, rotulo: "SAÍDA", Icone: LogOut },
];

export function StatusJornada({ resumo }: { resumo: ResumoJornadaDia }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {MARCOS.map(({ chave, rotulo, Icone }) => {
        const registro = resumo[chave];
        const feito = !!registro;

        return (
          <div
            key={chave}
            className={clsx(
              "flex flex-col items-center gap-2 rounded-card border p-4 text-center",
              feito ? "border-teal-500/30 bg-teal-100" : "border-surface-border bg-white"
            )}
          >
            <Icone className={clsx("h-5 w-5", feito ? "text-teal-600" : "text-ink-400")} />
            <span className="font-body text-xs font-semibold tracking-wide text-ink-600">
              {rotulo}
            </span>
            <span
              className={clsx(
                "font-mono text-lg tabular-nums",
                feito ? "text-navy-800" : "text-ink-400"
              )}
            >
              {formatarHorario(registro?.dataHora)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
