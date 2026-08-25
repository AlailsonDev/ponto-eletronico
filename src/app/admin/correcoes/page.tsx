"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/Button";
import type { SolicitacaoCorrecao } from "@/types/registroPonto";

function CorrecoesConteudo() {
  const { perfil, firebaseUser } = useAuth();
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoCorrecao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [processando, setProcessando] = useState<string | null>(null);

  async function carregar() {
    try {
      if (!firebaseUser) return;
      const token = await firebaseUser.getIdToken();
      const resposta = await fetch("/api/correcoes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resposta.ok) throw new Error();
      setSolicitacoes((await resposta.json()) as SolicitacaoCorrecao[]);
    }
    catch { setErro("Não foi possível carregar as solicitações."); }
    finally { setCarregando(false); }
  }
  useEffect(() => { if (firebaseUser) carregar(); }, [firebaseUser]);

  async function decidir(solicitacaoId: string, decisao: "aprovada" | "rejeitada") {
    if (!firebaseUser) return;
    setProcessando(solicitacaoId);
    setErro(null);
    try {
      const token = await firebaseUser.getIdToken();
      const resposta = await fetch("/api/correcoes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ solicitacaoId, decisao }),
      });
      if (!resposta.ok) throw new Error();
      setSolicitacoes((atuais) => atuais.filter((item) => item.id !== solicitacaoId));
    } catch { setErro("Não foi possível processar esta solicitação."); }
    finally { setProcessando(null); }
  }

  if (!perfil) return null;
  return <div className="min-h-screen bg-surface"><AppHeader usuario={perfil} /><main className="mx-auto max-w-4xl px-4 py-8">
    <h1 className="font-display text-2xl font-semibold text-ink-900">Correções de ponto</h1>
    <p className="mb-6 font-body text-sm text-ink-600">Revise solicitações pendentes dos funcionários.</p>
    {erro && <div role="alert" className="mb-4 flex gap-2 rounded-card border border-red-600/20 bg-red-100 px-4 py-3 text-sm text-red-600"><AlertTriangle className="h-4 w-4" />{erro}</div>}
    {carregando ? <p className="rounded-card border border-surface-border bg-white p-8 text-center text-sm text-ink-400">Carregando solicitações...</p> : solicitacoes.length === 0 ? <p className="rounded-card border border-surface-border bg-white p-8 text-center text-sm text-ink-600">Nenhuma solicitação pendente.</p> : <div className="space-y-3">
      {solicitacoes.map((item) => <div key={item.id} className="rounded-card border border-surface-border bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium text-ink-900">{item.data} · {item.tipo.replaceAll("_", " ")}</p><p className="text-sm text-ink-900">Solicitado por: <strong>{item.usuarioNome ?? "Usuário não identificado"}</strong></p><p className="text-sm text-ink-600">Registro: {item.registroId}</p><p className="mt-2 text-sm text-ink-900">Novo horário: <strong>{item.novoHorario}</strong></p><p className="text-sm text-ink-600">Motivo: {item.motivo}</p></div><div className="flex gap-2"><Button variant="secondary" disabled={!!processando} onClick={() => decidir(item.id, "rejeitada")}><X className="h-4 w-4" />Rejeitar</Button><Button disabled={!!processando} onClick={() => decidir(item.id, "aprovada")}><Check className="h-4 w-4" />Aprovar</Button></div></div></div>)}
    </div>}
  </main></div>;
}

export default function CorrecoesPage() { return <ProtectedRoute perfisPermitidos={["admin"]}><CorrecoesConteudo /></ProtectedRoute>; }