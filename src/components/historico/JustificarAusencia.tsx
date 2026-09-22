"use client";

import { useState } from "react";
import { CheckCircle2, Info, Loader2 } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import type { CategoriaAusencia, SolicitacaoCorrecao } from "@/types/registroPonto";
import { justificarAusencia } from "@/services/ponto.service";
import { dataHojeISO } from "@/lib/formatadores";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

const RÓTULOS_CATEGORIA: Record<CategoriaAusencia, string> = {
  atestado: "Atestado médico",
  folga: "Folga",
  outro: "Outro motivo",
};

export function JustificarAusencia({
  onCriada,
}: {
  onCriada: (solicitacao: SolicitacaoCorrecao) => void;
}) {
  const { firebaseUser, perfil } = useAuth();
  const [marcado, setMarcado] = useState(false);
  const [data, setData] = useState("");
  const [categoria, setCategoria] = useState<CategoriaAusencia>("atestado");
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  async function enviar() {
    if (!data || motivo.trim().length < 5) return;
    setEnviando(true);
    setErro(null);
    setSucesso(false);
    try {
      if (!firebaseUser || !perfil) throw new Error("Sessão expirada");
      await justificarAusencia({ data, categoria, motivo, idToken: await firebaseUser.getIdToken() });
      onCriada({
        id: `local-ausencia-${data}`,
        usuarioId: perfil.uid,
        setorId: perfil.setorId,
        data,
        categoria,
        motivo: motivo.trim(),
        status: "pendente",
        criadoEm: Timestamp.now(),
      });
      setData("");
      setMotivo("");
      setMarcado(false);
      setSucesso(true);
    } catch (erroCapturado) {
      setErro((erroCapturado as Error).message || "Não foi possível enviar a justificativa.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="mt-6 rounded-card border border-surface-border bg-white p-5">
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={marcado}
          onChange={(event) => { setMarcado(event.target.checked); setSucesso(false); }}
          className="mt-0.5 h-4 w-4 rounded border-surface-border text-teal-600 focus:ring-2 focus:ring-teal-100"
        />
        <span>
          <span className="font-display text-sm font-semibold text-ink-900">Faltei em um dia anterior</span>
          <span className="mt-1 block font-body text-sm text-ink-600">
            Marque aqui se faltou por atestado médico, folga ou outro motivo — em vez de solicitar um horário, você
            justifica o dia inteiro para o seu gestor avaliar.
          </span>
        </span>
      </label>

      {marcado && (
        <div className="mt-4 border-t border-surface-border pt-4">
          <div className="grid gap-3 sm:grid-cols-3 sm:items-end">
            <label className="font-body text-sm text-ink-600">
              Data da falta
              <input
                type="date"
                value={data}
                max={dataHojeISO()}
                onChange={(event) => setData(event.target.value)}
                className="mt-1 block w-full rounded-card border border-surface-border px-3 py-2"
              />
            </label>
            <label className="font-body text-sm text-ink-600">
              Motivo
              <select
                value={categoria}
                onChange={(event) => setCategoria(event.target.value as CategoriaAusencia)}
                className="mt-1 block w-full rounded-card border border-surface-border bg-white px-3 py-2"
              >
                {(Object.keys(RÓTULOS_CATEGORIA) as CategoriaAusencia[]).map((item) => (
                  <option key={item} value={item}>
                    {RÓTULOS_CATEGORIA[item]}
                  </option>
                ))}
              </select>
            </label>
            <label className="font-body text-sm text-ink-600 sm:col-span-1">
              Detalhes
              <input
                value={motivo}
                onChange={(event) => setMotivo(event.target.value)}
                placeholder="Ex.: consulta médica pela manhã"
                className="mt-1 block w-full rounded-card border border-surface-border px-3 py-2"
              />
            </label>
          </div>

          {categoria === "atestado" && (
            <p className="mt-3 flex items-start gap-2 rounded-card bg-amber-100 px-3 py-2 font-body text-xs text-amber-700">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Se a falta precisar de atestado, apresente o documento diretamente ao seu gestor — esta solicitação
              não substitui a entrega física/digital do atestado.
            </p>
          )}

          <div className="mt-4">
            <Button onClick={enviar} disabled={enviando || !data || motivo.trim().length < 5}>
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar justificativa"}
            </Button>
          </div>
        </div>
      )}

      {sucesso && (
        <p className="mt-3 flex items-center gap-2 font-body text-sm text-teal-700">
          <CheckCircle2 className="h-4 w-4" /> Justificativa enviada — aguarde a análise do seu gestor.
        </p>
      )}
      {erro && <p role="alert" className="mt-3 font-body text-sm text-red-600">{erro}</p>}
    </section>
  );
}
