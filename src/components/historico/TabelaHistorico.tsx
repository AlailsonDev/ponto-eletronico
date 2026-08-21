import { AlertCircle, Clock } from "lucide-react";
import type { ResumoJornadaDia } from "@/types/registroPonto";
import { formatarHorario, formatarMinutos, formatarDataBR } from "@/lib/formatadores";
import { Badge } from "@/components/ui/Badge";

export function TabelaHistorico({ dias }: { dias: ResumoJornadaDia[] }) {
  if (dias.length === 0) {
    return (
      <div className="rounded-card border border-surface-border bg-white p-10 text-center">
        <Clock className="mx-auto mb-3 h-8 w-8 text-ink-400" />
        <p className="font-body text-sm text-ink-600">
          Nenhum registro de ponto neste período.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-card border border-surface-border bg-white">
      <table className="w-full min-w-[640px] border-collapse font-body text-sm">
        <thead>
          <tr className="border-b border-surface-border text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
            <th className="px-4 py-3">Data</th>
            <th className="px-4 py-3">Entrada</th>
            <th className="px-4 py-3">Almoço</th>
            <th className="px-4 py-3">Retorno</th>
            <th className="px-4 py-3">Saída</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {dias.map((dia) => (
            <tr key={dia.data} className="border-b border-surface-border last:border-0">
              <td className="px-4 py-3 font-medium text-ink-900">{formatarDataBR(dia.data)}</td>
              <td className="px-4 py-3 font-mono tabular-nums text-ink-600">
                {formatarHorario(dia.entrada?.dataHora)}
              </td>
              <td className="px-4 py-3 font-mono tabular-nums text-ink-600">
                {formatarHorario(dia.saidaAlmoco?.dataHora)}
              </td>
              <td className="px-4 py-3 font-mono tabular-nums text-ink-600">
                {formatarHorario(dia.retornoAlmoco?.dataHora)}
              </td>
              <td className="px-4 py-3 font-mono tabular-nums text-ink-600">
                {formatarHorario(dia.saida?.dataHora)}
              </td>
              <td className="px-4 py-3 font-mono tabular-nums text-navy-800">
                {formatarMinutos(dia.minutosTrabalhados)}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                  {dia.incompleta && (
                    <Badge cor="red">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      Incompleto
                    </Badge>
                  )}
                  {!!dia.minutosAtraso && dia.minutosAtraso > 0 && (
                    <Badge cor="amber">Atraso {formatarMinutos(dia.minutosAtraso)}</Badge>
                  )}
                  {!!dia.minutosHoraExtra && dia.minutosHoraExtra > 0 && (
                    <Badge cor="green">Extra {formatarMinutos(dia.minutosHoraExtra)}</Badge>
                  )}
                  {!dia.incompleta && !dia.minutosAtraso && !dia.minutosHoraExtra && (
                    <Badge cor="neutral">Normal</Badge>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
