"use client";

import { AlertTriangle, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePontoHoje } from "@/hooks/usePontoHoje";
import { useRelogio } from "@/hooks/useRelogio";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppHeader } from "@/components/layout/AppHeader";
import { StatusJornada } from "@/components/ponto/StatusJornada";
import { BotaoRegistro } from "@/components/ponto/BotaoRegistro";
import { ResumoJornadaCards } from "@/components/ponto/ResumoJornadaCards";
import { saudacaoPorHorario } from "@/lib/formatadores";

function DashboardConteudo() {
  const { perfil } = useAuth();
  const agora = useRelogio();
  const { resumo, proximoTipo, diaNaoTrabalhado, registrar, registrando, carregando, erro, limparErro } =
    usePontoHoje(perfil);

  if (!perfil) return null;

  const primeiroNome = perfil.nome.split(" ")[0];

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader usuario={perfil} />

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink-900">
              {saudacaoPorHorario()}, {primeiroNome}!
            </h1>
            <p className="font-body text-sm text-ink-600">
              {agora
                ? agora.toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                  })
                : ""}
            </p>
          </div>
          <p className="font-mono text-2xl tabular-nums text-navy-800" aria-live="polite">
            {agora
              ? agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
              : "--:--"}
          </p>
        </div>

        {erro && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-2 rounded-card border border-red-600/20 bg-red-100 px-4 py-3 font-body text-sm text-red-600"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="flex-1">{erro}</span>
            <button onClick={limparErro} aria-label="Fechar aviso">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {carregando ? (
          <div className="rounded-card border border-surface-border bg-white p-8 text-center font-body text-sm text-ink-400">
            Carregando seus registros de hoje…
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <StatusJornada resumo={resumo} />

            <BotaoRegistro
              proximoTipo={proximoTipo}
              diaNaoTrabalhado={diaNaoTrabalhado}
              registrando={registrando}
              onRegistrar={registrar}
            />

            <div>
              <h2 className="mb-3 font-display text-sm font-semibold text-ink-900">
                Resumo de hoje
              </h2>
              <ResumoJornadaCards resumo={resumo} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  // Sem restrição de perfil: gestor e admin também têm jornada própria e
  // precisam bater ponto aqui. As áreas administrativas ficam em rotas
  // separadas (/admin/*, /gestor/*).
  return (
    <ProtectedRoute>
      <DashboardConteudo />
    </ProtectedRoute>
  );
}
