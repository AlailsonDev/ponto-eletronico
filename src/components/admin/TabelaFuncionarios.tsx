import { Pencil, UserX, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { Usuario } from "@/types/usuario";
import type { Setor } from "@/types/setor";

const RÓTULO_PERFIL: Record<Usuario["perfil"], string> = {
  funcionario: "Funcionário",
  gestor: "Gestor",
  admin: "Administrador",
};

export function TabelaFuncionarios({
  funcionarios,
  setores,
  onEditar,
  onDesativar,
}: {
  funcionarios: Usuario[];
  setores: Setor[];
  onEditar: (funcionario: Usuario) => void;
  onDesativar: (funcionario: Usuario) => void;
}) {
  const nomeDoSetor = (setorId: string) => setores.find((s) => s.id === setorId)?.nome ?? "—";

  if (funcionarios.length === 0) {
    return (
      <div className="rounded-card border border-surface-border bg-white p-10 text-center">
        <Users className="mx-auto mb-3 h-8 w-8 text-ink-400" />
        <p className="font-body text-sm text-ink-600">Nenhum funcionário cadastrado ainda.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-card border border-surface-border bg-white">
      <table className="w-full min-w-[820px] border-collapse font-body text-sm">
        <thead>
          <tr className="border-b border-surface-border text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
            <th className="px-4 py-3">Nome</th>
            <th className="px-4 py-3">Matrícula</th>
            <th className="px-4 py-3">Setor</th>
            <th className="px-4 py-3">Perfil</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Ação</th>
          </tr>
        </thead>
        <tbody>
          {funcionarios.map((f) => (
            <tr key={f.uid} className="border-b border-surface-border last:border-0">
              <td className="px-4 py-3">
                <p className="font-medium text-ink-900">{f.nome}</p>
                <p className="text-xs text-ink-400">{f.email}</p>
              </td>
              <td className="px-4 py-3 text-ink-600">{f.matricula}</td>
              <td className="px-4 py-3 text-ink-600">{nomeDoSetor(f.setorId)}</td>
              <td className="px-4 py-3 text-ink-600">{RÓTULO_PERFIL[f.perfil]}</td>
              <td className="px-4 py-3">
                <Badge cor={f.status === "ativo" ? "green" : "neutral"}>
                  {f.status === "ativo" ? "Ativo" : "Inativo"}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEditar(f)}
                    aria-label={`Editar ${f.nome}`}
                    title={`Editar ${f.nome}`}
                    className="inline-flex items-center gap-1.5 rounded-card px-2.5 py-1.5 text-xs font-medium text-navy-800 hover:bg-surface"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </button>
                  {f.status === "ativo" && (
                  <button
                    type="button"
                    onClick={() => onDesativar(f)}
                    aria-label={`Desativar ${f.nome}`}
                    title={`Desativar ${f.nome}`}
                    className="inline-flex items-center gap-1.5 rounded-card px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
                  >
                    <UserX className="h-3.5 w-3.5" />
                    Desativar
                  </button>
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
