"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import type { RegistroPonto, SolicitacaoCorrecao } from "@/types/registroPonto";
import { criarSolicitacaoCorrecao } from "@/services/ponto.service";
import { formatarDataBR, formatarHorario } from "@/lib/formatadores";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

export function SolicitarCorrecao({
  registros,
  solicitacoes,
  onCriada,
}: {
  registros: RegistroPonto[];
  solicitacoes: SolicitacaoCorrecao[];
  onCriada: (solicitacao: SolicitacaoCorrecao) => void;
}) {
  const { firebaseUser } = useAuth();
  const [registro, setRegistro] = useState<RegistroPonto | null>(null);
  const [novoHorario, setNovoHorario] = useState("");
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar() {
    if (!registro || novoHorario.length !== 5 || motivo.trim().length < 5) return;
    setEnviando(true);
    setErro(null);
    try {
      if (!firebaseUser) throw new Error("Sessão expirada");
      await criarSolicitacaoCorrecao({ registro, novoHorario, motivo, idToken: await firebaseUser.getIdToken() });
      onCriada({
        id: `local-${registro.id}`,
        registroId: registro.id,
        usuarioId: registro.usuarioId,
        setorId: registro.setorId,
        data: registro.data,
        tipo: registro.tipo,
        novoHorario,
        motivo: motivo.trim(),
        status: "pendente",
        criadoEm: Timestamp.now(),
      });
      setRegistro(null);
      setNovoHorario("");
      setMotivo("");
    } catch {
      setErro("Não foi possível enviar a solicitação.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="mt-6 rounded-card border border-surface-border bg-white p-5">
      <h2 className="font-display text-sm font-semibold text-ink-900">Solicitar correção</h2>
      <p className="mt-1 font-body text-sm text-ink-600">Selecione um registro e informe o horário correto.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {registros.map((item) => {
          const pedido = solicitacoes.find(
            (solicitacao) => solicitacao.registroId === item.id && solicitacao.status === "pendente"
          );
          return (
            <button
              type="button"
              key={item.id}
              disabled={!!pedido}
              onClick={() => { setRegistro(item); setNovoHorario(formatarHorario(item.dataHora)); }}
              className="flex items-center justify-between rounded-card border border-surface-border px-3 py-2 text-left text-sm hover:border-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span><strong>{formatarDataBR(item.data)}</strong> · {item.tipo.replaceAll("_", " ")}</span>
              <span className="font-mono">{formatarHorario(item.dataHora)}</span>
              {pedido && <CheckCircle2 className="h-4 w-4 text-teal-600" aria-label="Solicitado" />}
            </button>
          );
        })}
      </div>
      {registro && (
        <div className="mt-4 grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-end">
          <label className="font-body text-sm text-ink-600">Novo horário
            <input type="time" value={novoHorario} onChange={(event) => setNovoHorario(event.target.value)} className="mt-1 block rounded-card border border-surface-border px-3 py-2" />
          </label>
          <label className="font-body text-sm text-ink-600">Motivo
            <input value={motivo} onChange={(event) => setMotivo(event.target.value)} placeholder="Ex.: esqueci de registrar" className="mt-1 block w-full rounded-card border border-surface-border px-3 py-2" />
          </label>
          <Button onClick={enviar} disabled={motivo.trim().length < 5}>
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar"}
          </Button>
        </div>
      )}
      {erro && <p role="alert" className="mt-3 text-sm text-red-600">{erro}</p>}
    </section>
  );
}