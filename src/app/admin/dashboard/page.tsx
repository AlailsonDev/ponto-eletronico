"use client";

import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardAdmin } from "@/hooks/useDashboardAdmin";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppHeader } from "@/components/layout/AppHeader";
import { CardsResumoAdmin } from "@/components/admin/CardsResumoAdmin";
import { GraficoStatusFuncionarios } from "@/components/admin/GraficoStatusFuncionarios";
import { ListaFuncionariosStatus } from "@/components/admin/ListaFuncionariosStatus";

function DashboardAdminConteudo() {
  const { perfil } = useAuth();
  const { funcionariosComStatus, contadores, totalCadastrados, carregando, erro } =
    useDashboardAdmin();

  if (!perfil) return null;

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader usuario={perfil} />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-ink-900">
            Painel administrativo
          </h1>
          <p className="font-body text-sm text-ink-600">
            {totalCadastrados} funcionário{totalCadastrados !== 1 ? "s" : ""} cadastrado
            {totalCadastrados !== 1 ? "s" : ""}, {contadores.totalAtivos} ativo
            {contadores.totalAtivos !== 1 ? "s" : ""}. Atualizado em tempo real.
          </p>
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
            Carregando painel…
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <CardsResumoAdmin contadores={contadores} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <GraficoStatusFuncionarios contadores={contadores} />

              <div>
                <h2 className="mb-3 font-display text-sm font-semibold text-ink-900">
                  Funcionários agora
                </h2>
                <ListaFuncionariosStatus funcionarios={funcionariosComStatus} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function DashboardAdminPage() {
  return (
    <ProtectedRoute perfisPermitidos={["admin"]}>
      <DashboardAdminConteudo />
    </ProtectedRoute>
  );
}
