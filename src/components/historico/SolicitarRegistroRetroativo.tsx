"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { SEQUENCIA_PONTO, type SolicitacaoCorrecao, type TipoRegistro } from "@/types/registroPonto";
import { rotuloBotaoParaTipo } from "@/lib/validacaoSequencia";
import { solicitarRegistroRetroativo } from "@/services/ponto.service";
import { dataHojeISO } from "@/lib/formatadores";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

export function SolicitarRegistroRetroativo({
  onCriada,
}: {
  onCriada: (solicitacao: SolicitacaoCorrecao) => void;
}) {
  const { firebaseUser, perfil } = useAuth();
  const [data, setData] = useState("");
  const [tipo, setTipo] = useState<TipoRegistro>("ENTRADA");
  const [horario, setHorario] = useState("");
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  async function enviar() {
    if (!data || horario.length !== 5 || motivo.trim().length < 5) return;
    setEnviando(true);
    setErro(null);
    setSucesso(false);
    try {
      if (!firebaseUser || !perfil) throw new Error("Sessão expirada");
      await solicitarRegistroRetroativo({ data, tipo, novoHorario: horario, motivo, idToken: await firebaseUser.getIdToken() });
      onCriada({
        id: `local-${data}-${tipo}`,
        usuarioId: perfil.uid,
        setorId: perfil.setorId,
        data,
        tipo,
        novoHorario: horario,
        motivo: motivo.trim(),
        status: "pendente",
        criadoEm: Timestamp.now(),
      });
      setData("");
      setHorario("");
      setMotivo("");
      setSucesso(true);
    } catch (erroCapturado) {
      setErro((erroCapturado as Error).message || "Não foi possível enviar a solicitação.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="mt-6 rounded-card border border-surface-border bg-white p-5">
      <h2 className="font-display text-sm font-semibold text-ink-900">Esqueceu alguma batida em dias anteriores?</h2>
      <p className="mt-1 font-body text-sm text-ink-600">
        Estava ausente, esqueceu ou o sistema ficou fora do ar? Peça a inclusão do ponto que faltou — ele só passa a
        valer depois de aprovado pelo seu gestor.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:items-end lg:grid-cols-4">
        <label className="font-body text-sm text-ink-600">
          Data
          <input
            type="date"
            value={data}
            max={dataHojeISO()}
            onChange={(event) => setData(event.target.value)}
            className="mt-1 block w-full rounded-card border border-surface-border px-3 py-2"
          />
        </label>
        <label className="font-body text-sm text-ink-600">
          Marco
          <select
            value={tipo}
            onChange={(event) => setTipo(event.target.value as TipoRegistro)}
            className="mt-1 block w-full rounded-card border border-surface-border bg-white px-3 py-2"
          >
            {SEQUENCIA_PONTO.map((item) => (
              <option key={item} value={item}>
                {rotuloBotaoParaTipo(item)}
              </option>
            ))}
          </select>
        </label>
        <label className="font-body text-sm text-ink-600">
          Horário
          <input
            type="time"
            value={horario}
            onChange={(event) => setHorario(event.target.value)}
            className="mt-1 block w-full rounded-card border border-surface-border px-3 py-2"
          />
        </label>
        <label className="font-body text-sm text-ink-600">
          Motivo
          <input
            value={motivo}
            onChange={(event) => setMotivo(event.target.value)}
            placeholder="Ex.: esqueci de bater o ponto"
            className="mt-1 block w-full rounded-card border border-surface-border px-3 py-2"
          />
        </label>
      </div>
      <div className="mt-4">
        <Button onClick={enviar} disabled={enviando || !data || horario.length !== 5 || motivo.trim().length < 5}>
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Solicitar registro"}
        </Button>
      </div>
      {sucesso && (
        <p className="mt-3 flex items-center gap-2 font-body text-sm text-teal-700">
          <CheckCircle2 className="h-4 w-4" /> Solicitação enviada — aguarde a aprovação do seu gestor.
        </p>
      )}
      {erro && <p role="alert" className="mt-3 font-body text-sm text-red-600">{erro}</p>}
    </section>
  );
}
