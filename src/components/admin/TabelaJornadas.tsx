import { Pencil, Trash2 } from "lucide-react";
import type { Jornada } from "@/types/jornada";
import { formatarMinutos } from "@/lib/formatadores";

export function TabelaJornadas({
  jornadas,
  onEditar,
  onExcluir,
}: {
  jornadas: Jornada[];
  onEditar: (jornada: Jornada) => void;
  onExcluir: (jornada: Jornada) => void;
}) {
  if (jornadas.length === 0) {
    return (
      <div className="rounded-card border border-surface-border bg-white p-8 text-center font-body text-sm text-ink-400">
        Nenhuma jornada cadastrada ainda.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-card border border-surface-border bg-white">
      <table className="w-full min-w-[640px] border-collapse font-body text-sm">
        <thead>
          <tr className="border-b border-surface-border text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
            <th className="px-4 py-3">Nome</th>
            <th className="px-4 py-3">Entrada</th>
            <th className="px-4 py-3">Almoço</th>
            <th className="px-4 py-3">Retorno</th>
            <th className="px-4 py-3">Saída</th>
            <th className="px-4 py-3">Carga diária</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {jornadas.map((jornada) => (
            <tr key={jornada.id} className="border-b border-surface-border last:border-0">
              <td className="px-4 py-3 font-medium text-ink-900">{jornada.nome}</td>
              <td className="px-4 py-3 font-mono tabular-nums text-ink-600">{jornada.entrada}</td>
              <td className="px-4 py-3 font-mono tabular-nums text-ink-600">
                {jornada.intervaloAlmocoLivre ? "Livre" : jornada.saidaAlmoco}
              </td>
              <td className="px-4 py-3 font-mono tabular-nums text-ink-600">
                {jornada.intervaloAlmocoLivre ? "Livre" : jornada.retornoAlmoco}
              </td>
              <td className="px-4 py-3 font-mono tabular-nums text-ink-600">{jornada.saida}</td>
              <td className="px-4 py-3 font-mono tabular-nums text-navy-800">
                {formatarMinutos(jornada.cargaHorariaDiariaMinutos)}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onEditar(jornada)}
                  aria-label={`Editar ${jornada.nome}`}
                  className="flex h-8 w-8 items-center justify-center rounded-card text-ink-400 hover:bg-surface"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onExcluir(jornada)}
                  aria-label={`Excluir ${jornada.nome}`}
                  title={`Excluir ${jornada.nome}`}
                  className="flex h-8 w-8 items-center justify-center rounded-card text-ink-400 hover:bg-red-100 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
