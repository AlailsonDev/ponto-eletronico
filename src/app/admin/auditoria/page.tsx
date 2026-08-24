"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, History } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppHeader } from "@/components/layout/AppHeader";
import type { RegistroAuditoria } from "@/types/auditoria";

function AuditoriaConteudo() {
  const { perfil, firebaseUser } = useAuth();
  const [registros, setRegistros] = useState<RegistroAuditoria[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!firebaseUser) return;
    firebaseUser.getIdToken().then((token) => fetch("/api/auditoria", {
      headers: { Authorization: `Bearer ${token}` },
    })).then(async (resposta) => {
      if (!resposta.ok) throw new Error();
      setRegistros((await resposta.json()) as RegistroAuditoria[]);
    }).catch(() => setErro("Não foi possível carregar a auditoria."))
      .finally(() => setCarregando(false));
  }, [firebaseUser]);

  function detalhesLegiveis(registro: RegistroAuditoria): string {
    const detalhes = registro.detalhes;
    if (registro.acao === "cadastro_funcionario") {
      return `Funcionário cadastrado: ${String(detalhes.nome ?? registro.alvoNome ?? "não informado")}`;
    }
    if (registro.acao === "correcao_ponto") {
      const decisao = detalhes.decisao === "aprovada" ? "aprovada" : "rejeitada";
      return `Correção ${decisao} para ${registro.usuarioNome ?? "usuário não identificado"}. Novo horário: ${String(detalhes.novoHorario ?? "não informado")}`;
    }
    return `Usuário afetado: ${registro.alvoNome ?? "não identificado"}`;
  }

  if (!perfil) return null;
  return <div className="min-h-screen bg-surface"><AppHeader usuario={perfil} /><main className="mx-auto max-w-5xl px-4 py-8">
    <h1 className="font-display text-2xl font-semibold text-ink-900">Auditoria</h1>
    <p className="mb-6 font-body text-sm text-ink-600">Histórico das ações administrativas registradas pelo sistema.</p>
    {erro && <div role="alert" className="mb-4 flex gap-2 rounded-card border border-red-600/20 bg-red-100 px-4 py-3 text-sm text-red-600"><AlertTriangle className="h-4 w-4" />{erro}</div>}
    {carregando ? <p className="rounded-card border border-surface-border bg-white p-8 text-center text-sm text-ink-400">Carregando auditoria...</p> : registros.length === 0 ? <div className="rounded-card border border-surface-border bg-white p-10 text-center"><History className="mx-auto mb-3 h-8 w-8 text-ink-400" /><p className="text-sm text-ink-600">Nenhuma ação registrada.</p></div> : <div className="overflow-x-auto rounded-card border border-surface-border bg-white"><table className="w-full min-w-[720px] text-left text-sm"><thead><tr className="border-b border-surface-border text-xs uppercase text-ink-400"><th className="px-4 py-3">Data</th><th className="px-4 py-3">Ação</th><th className="px-4 py-3">Administrador</th><th className="px-4 py-3">Usuário</th><th className="px-4 py-3">Detalhes</th></tr></thead><tbody>{registros.map((registro) => <tr key={registro.id} className="border-b border-surface-border last:border-0"><td className="px-4 py-3">{registro.criadoEm ? new Date(registro.criadoEm as string).toLocaleString("pt-BR") : "-"}</td><td className="px-4 py-3 font-medium capitalize text-ink-900">{registro.acao.replaceAll("_", " ")}</td><td className="px-4 py-3"><p>{registro.administradorNome ?? "Não identificado"}</p><p className="text-xs text-ink-400">ID: {registro.administradorId}</p></td><td className="px-4 py-3"><p>{registro.usuarioNome ?? registro.alvoNome ?? "Não identificado"}</p><p className="text-xs text-ink-400">ID: {registro.alvoId}</p></td><td className="px-4 py-3 text-ink-600">{detalhesLegiveis(registro)}</td></tr>)}</tbody></table></div>}
  </main></div>;
}

export default function AuditoriaPage() { return <ProtectedRoute perfisPermitidos={["admin"]}><AuditoriaConteudo /></ProtectedRoute>; }