"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGerenciamentoJornadas } from "@/hooks/useGerenciamentoJornadas";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppHeader } from "@/components/layout/AppHeader";
import { FormularioJornada } from "@/components/admin/FormularioJornada";
import { TabelaJornadas } from "@/components/admin/TabelaJornadas";
import { ConfirmacaoModal } from "@/components/ui/ConfirmacaoModal";
import type { Jornada } from "@/types/jornada";
import type { DadosJornada } from "@/services/jornadas.service";

function JornadasConteudo() {
  const { perfil } = useAuth();
  const { jornadas, carregando, enviando, erro, criar, editar, excluir } = useGerenciamentoJornadas();
  const [jornadaEmEdicao, setJornadaEmEdicao] = useState<Jornada | null>(null);
  const [jornadaParaExcluir, setJornadaParaExcluir] = useState<Jornada | null>(null);

  if (!perfil) return null;

  async function handleSubmit(dados: DadosJornada) {
    if (jornadaEmEdicao) {
      await editar(jornadaEmEdicao.id, dados);
      setJornadaEmEdicao(null);
    } else {
      await criar(dados);
    }
  }

  function handleExcluir(jornada: Jornada) {
    setJornadaParaExcluir(jornada);
  }

  async function confirmarExclusao() {
    if (!jornadaParaExcluir) return;
    await excluir(jornadaParaExcluir.id);
    if (jornadaEmEdicao?.id === jornadaParaExcluir.id) setJornadaEmEdicao(null);
    setJornadaParaExcluir(null);
  }

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader usuario={perfil} />

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-ink-900">Jornadas</h1>
          <p className="font-body text-sm text-ink-600">
            Configure os horários de entrada, almoço e saída usados no cálculo de atraso e
            hora extra. O intervalo de almoço também pode ser livre. Selecione os dias em que a
            jornada se aplica; sábado e domingo começam desmarcados.
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
          <h2 className="mb-4 font-display text-sm font-semibold text-ink-900">
            {jornadaEmEdicao ? `Editando "${jornadaEmEdicao.nome}"` : "Nova jornada"}
          </h2>
          <FormularioJornada
            enviando={enviando}
            jornadaEmEdicao={jornadaEmEdicao}
            onSubmit={handleSubmit}
            onCancelarEdicao={() => setJornadaEmEdicao(null)}
          />
        </section>

        {carregando ? (
          <div className="rounded-card border border-surface-border bg-white p-8 text-center font-body text-sm text-ink-400">
            Carregando jornadas…
          </div>
        ) : (
          <TabelaJornadas
            jornadas={jornadas}
            onEditar={setJornadaEmEdicao}
            onExcluir={handleExcluir}
          />
        )}
      </main>
      <ConfirmacaoModal
        aberto={!!jornadaParaExcluir}
        titulo="Excluir jornada"
        mensagem={jornadaParaExcluir ? `Excluir a jornada "${jornadaParaExcluir.nome}"?` : ""}
        textoConfirmar="Excluir"
        variante="danger"
        onCancelar={() => setJornadaParaExcluir(null)}
        onConfirmar={confirmarExclusao}
      />
    </div>
  );
}

export default function JornadasPage() {
  return (
    <ProtectedRoute perfisPermitidos={["admin"]}>
      <JornadasConteudo />
    </ProtectedRoute>
  );
}
