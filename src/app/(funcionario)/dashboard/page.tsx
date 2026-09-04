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
import { useRetrospectiva } from "@/hooks/useRetrospectiva";
import { RetrospectivaModal } from "@/components/retrospectiva/RetrospectivaModal";
import dynamic from "next/dynamic";

const MapaLocalizacao = dynamic(() => import("@/components/ponto/MapaLocalizacao").then((modulo) => modulo.MapaLocalizacao), { ssr: false });

function DashboardConteudo() {
  const { perfil } = useAuth();
  const retrospectiva = useRetrospectiva(perfil);
  const agora = useRelogio();
  const { resumo, proximoTipo, diaNaoTrabalhado, registrar, registrando, carregando, erro, limparErro, setor, geolocalizacao } =
    usePontoHoje(perfil);

  if (!perfil) return null;

  const primeiroNome = perfil.nome.split(" ")[0];

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader usuario={retrospectiva.retrospectiva ? { ...perfil, insigniaAtual: retrospectiva.retrospectiva.insignia } : perfil} />

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
          {retrospectiva.retrospectiva && (
            <button
              type="button"
              onClick={retrospectiva.abrir}
              className="font-body text-xs font-semibold text-navy-800 underline underline-offset-4 hover:text-teal-600"
            >
              Minha retrospectiva
            </button>
          )}
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

            <section className="rounded-card border border-surface-border bg-white p-4">
              <h2 className="font-display text-sm font-semibold text-ink-900">Validação de localização</h2>
              {geolocalizacao.posicao && setor?.latitude !== undefined && setor.longitude !== undefined && (
                <MapaLocalizacao
                  usuario={{ latitude: geolocalizacao.posicao.latitude, longitude: geolocalizacao.posicao.longitude }}
                  trabalho={{ latitude: setor.latitude, longitude: setor.longitude }}
                  raioMetros={setor.raioMetros ?? 100}
                  valida={geolocalizacao.valida}
                />
              )}
              <p className="mt-3 font-body text-sm text-ink-700" role="status" aria-live="polite">
                {geolocalizacao.status === "obtendo" && "Obtendo sua localização..."}
                {geolocalizacao.valida && `✓ ${geolocalizacao.obrigatoria ? "Você está no local de trabalho" : "Localização disponível"}. Distância: ${Math.round(geolocalizacao.distancia ?? 0)} metros`}
                {geolocalizacao.status === "fora-do-raio" && `${geolocalizacao.obrigatoria ? "⚠ Você está fora da área permitida" : "Localização disponível"}. Distância: ${Math.round(geolocalizacao.distancia ?? 0)} metros${!geolocalizacao.obrigatoria ? ". O registro continuará normalmente neste dispositivo." : ""}`}
                {geolocalizacao.status === "erro" && (geolocalizacao.erro ?? (!geolocalizacao.obrigatoria && "Localização não disponível. O registro de ponto continuará normalmente neste dispositivo."))}
              </p>
              {geolocalizacao.obrigatoria && geolocalizacao.status !== "valida" && <button type="button" onClick={geolocalizacao.solicitar} className="mt-3 text-sm font-semibold text-navy-800 underline">Tentar novamente</button>}
            </section>

            <BotaoRegistro
              proximoTipo={proximoTipo}
              diaNaoTrabalhado={diaNaoTrabalhado}
              registrando={registrando}
              desabilitado={geolocalizacao.obrigatoria && !geolocalizacao.valida}
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
      {retrospectiva.retrospectiva && <RetrospectivaModal retrospectiva={retrospectiva.retrospectiva} aberto={retrospectiva.aberta} onFechar={retrospectiva.fechar} />}
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
