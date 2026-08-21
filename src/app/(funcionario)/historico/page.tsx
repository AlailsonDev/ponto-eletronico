"use client";

import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useHistorico } from "@/hooks/useHistorico";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppHeader } from "@/components/layout/AppHeader";
import { FiltroMes } from "@/components/historico/FiltroMes";
import { TabelaHistorico } from "@/components/historico/TabelaHistorico";

function HistoricoConteudo() {
  const { perfil } = useAuth();
  const { dias, anoMesSelecionado, setAnoMesSelecionado, carregando, erro } =
    useHistorico(perfil);

  if (!perfil) return null;

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader usuario={perfil} />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink-900">Histórico</h1>
            <p className="font-body text-sm text-ink-600">
              Consulte seus registros de ponto por mês.
            </p>
          </div>
          <FiltroMes anoMesSelecionado={anoMesSelecionado} onChange={setAnoMesSelecionado} />
        </div>

        {erro && (
          <div
            role="alert"
            className="mb-6 flex items-center gap-2 rounded-card border border-red-600/20 bg-red-100 px-4 py-3 font-body text-sm text-red-600"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="rounded-card border border-surface-border bg-white p-8 text-center font-body text-sm text-ink-400">
            Carregando histórico…
          </div>
        ) : (
          <TabelaHistorico dias={dias} />
        )}
      </main>
    </div>
  );
}

export default function HistoricoPage() {
  return (
    <ProtectedRoute>
      <HistoricoConteudo />
    </ProtectedRoute>
  );
}
