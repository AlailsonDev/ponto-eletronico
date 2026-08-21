import clsx from "clsx";
import { Badge } from "@/components/ui/Badge";
import { rotuloStatus, type StatusFuncionarioHoje } from "@/lib/statusFuncionarioHoje";
import type { FuncionarioComStatus } from "@/hooks/useDashboardAdmin";

const COR_POR_STATUS: Record<StatusFuncionarioHoje, "green" | "amber" | "neutral" | "red"> = {
  trabalhando: "green",
  em_almoco: "neutral",
  concluido: "neutral",
  atrasado: "red",
  ausente: "neutral",
};

// Ordem de exibição: quem precisa de atenção primeiro.
const PRIORIDADE: Record<StatusFuncionarioHoje, number> = {
  atrasado: 0,
  trabalhando: 1,
  em_almoco: 2,
  ausente: 3,
  concluido: 4,
};

export function ListaFuncionariosStatus({ funcionarios }: { funcionarios: FuncionarioComStatus[] }) {
  const ordenados = [...funcionarios].sort(
    (a, b) => PRIORIDADE[a.status] - PRIORIDADE[b.status] || a.usuario.nome.localeCompare(b.usuario.nome)
  );

  if (ordenados.length === 0) {
    return (
      <div className="rounded-card border border-surface-border bg-white p-8 text-center font-body text-sm text-ink-400">
        Nenhum funcionário ativo cadastrado.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-card border border-surface-border bg-white">
      <ul className="divide-y divide-surface-border">
        {ordenados.map(({ usuario, status }) => (
          <li
            key={usuario.uid}
            className={clsx(
              "flex items-center justify-between px-4 py-3",
              status === "atrasado" && "bg-red-100/40"
            )}
          >
            <div>
              <p className="font-body text-sm font-medium text-ink-900">{usuario.nome}</p>
              <p className="font-body text-xs text-ink-400">{usuario.cargo}</p>
            </div>
            <Badge cor={COR_POR_STATUS[status]}>{rotuloStatus(status)}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
