"use client";

import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGerenciamentoSetores } from "@/hooks/useGerenciamentoSetores";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppHeader } from "@/components/layout/AppHeader";
import { FormularioSetor } from "@/components/admin/FormularioSetor";
import { TabelaSetores } from "@/components/admin/TabelaSetores";

function SetoresConteudo() {
  const { perfil } = useAuth();
  const { setores, carregando, enviando, erro, criar, alternarAtivo, renomear } =
    useGerenciamentoSetores();

  if (!perfil) return null;

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader usuario={perfil} />

      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-ink-900">Setores</h1>
          <p className="font-body text-sm text-ink-600">
            Gerencie os setores usados no cadastro de funcionários e na visão do gestor.
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

        <section className="mb-6 rounded-card border border-surface-border bg-white p-5">
          <FormularioSetor enviando={enviando} onSubmit={criar} />
        </section>

        {carregando ? (
          <div className="rounded-card border border-surface-border bg-white p-8 text-center font-body text-sm text-ink-400">
            Carregando setores…
          </div>
        ) : (
          <TabelaSetores setores={setores} onAlternarAtivo={alternarAtivo} onRenomear={renomear} />
        )}
      </main>
    </div>
  );
}

export default function SetoresPage() {
  return (
    <ProtectedRoute perfisPermitidos={["admin"]}>
      <SetoresConteudo />
    </ProtectedRoute>
  );
}
