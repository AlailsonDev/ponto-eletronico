"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCadastroFuncionarios } from "@/hooks/useCadastroFuncionarios";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppHeader } from "@/components/layout/AppHeader";
import { FormularioFuncionario } from "@/components/admin/FormularioFuncionario";
import { TabelaFuncionarios } from "@/components/admin/TabelaFuncionarios";
import { ConfirmacaoModal } from "@/components/ui/ConfirmacaoModal";
import type { Usuario } from "@/types/usuario";

function CadastroFuncionariosConteudo() {
  const { perfil } = useAuth();
  const {
    setores,
    jornadas,
    funcionarios,
    carregando,
    enviando,
    erro,
    sucesso,
    cadastrar,
    editar,
    desativar,
    limparMensagens,
  } = useCadastroFuncionarios();
  const [funcionarioParaDesativar, setFuncionarioParaDesativar] = useState<Usuario | null>(null);
  const [funcionarioEmEdicao, setFuncionarioEmEdicao] = useState<Usuario | null>(null);

  function handleDesativar(funcionario: Usuario) {
    setFuncionarioParaDesativar(funcionario);
  }

  async function handleSubmit(input: Parameters<typeof cadastrar>[0]) {
    if (funcionarioEmEdicao) {
      const { senhaProvisoria: _senhaProvisoria, ...dados } = input;
      await editar(funcionarioEmEdicao.uid, dados);
      setFuncionarioEmEdicao(null);
      return;
    }
    await cadastrar(input);
  }

  async function confirmarDesativacao() {
    if (!funcionarioParaDesativar) return;
    await desativar(funcionarioParaDesativar.uid);
    setFuncionarioParaDesativar(null);
  }

  if (!perfil) return null;

  return (
    <div className="min-h-screen bg-surface">
      <AppHeader usuario={perfil} />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-ink-900">Funcionários</h1>
          <p className="font-body text-sm text-ink-600">
            Cadastre novos funcionários e acompanhe quem já tem acesso ao sistema.
          </p>
        </div>

        {erro && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-2 rounded-card border border-red-600/20 bg-red-100 px-4 py-3 font-body text-sm text-red-600"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="flex-1">{erro}</span>
            <button onClick={limparMensagens} aria-label="Fechar aviso">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {sucesso && (
          <div
            role="status"
            className="mb-6 flex items-start gap-2 rounded-card border border-green-600/20 bg-green-100 px-4 py-3 font-body text-sm text-green-600"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="flex-1">{sucesso}</span>
            <button onClick={limparMensagens} aria-label="Fechar aviso">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {carregando ? (
          <div className="rounded-card border border-surface-border bg-white p-8 text-center font-body text-sm text-ink-400">
            Carregando…
          </div>
        ) : setores.length === 0 || jornadas.length === 0 ? (
          <div className="rounded-card border border-amber-600/20 bg-amber-100 p-6 font-body text-sm text-amber-600">
            Antes de cadastrar funcionários, é preciso ter ao menos um{" "}
            <Link href="/admin/setores" className="font-semibold underline">
              setor
            </Link>{" "}
            e uma{" "}
            <Link href="/admin/jornadas" className="font-semibold underline">
              jornada
            </Link>{" "}
            cadastrados.
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <section className="rounded-card border border-surface-border bg-white p-6">
              <h2 className="mb-4 font-display text-sm font-semibold text-ink-900">
                {funcionarioEmEdicao ? `Editando "${funcionarioEmEdicao.nome}"` : "Novo funcionário"}
              </h2>
              <FormularioFuncionario
                setores={setores}
                jornadas={jornadas}
                enviando={enviando}
                funcionario={funcionarioEmEdicao}
                onSubmit={handleSubmit}
                onCancelarEdicao={() => setFuncionarioEmEdicao(null)}
              />
            </section>

            <section>
              <h2 className="mb-3 font-display text-sm font-semibold text-ink-900">
                Funcionários cadastrados ({funcionarios.length})
              </h2>
              <TabelaFuncionarios
                funcionarios={funcionarios}
                setores={setores}
                onEditar={setFuncionarioEmEdicao}
                onDesativar={handleDesativar}
              />
            </section>
          </div>
        )}
      </main>
      <ConfirmacaoModal
        aberto={!!funcionarioParaDesativar}
        titulo="Desativar funcionário"
        mensagem={
          funcionarioParaDesativar
            ? `Desativar o funcionário "${funcionarioParaDesativar.nome}"? Ele não poderá mais acessar o sistema, mas seus dados e registros serão preservados.`
            : ""
        }
        textoConfirmar="Desativar"
        variante="danger"
        onCancelar={() => setFuncionarioParaDesativar(null)}
        onConfirmar={confirmarDesativacao}
      />
    </div>
  );
}

export default function CadastroFuncionariosPage() {
  return (
    <ProtectedRoute perfisPermitidos={["admin"]}>
      <CadastroFuncionariosConteudo />
    </ProtectedRoute>
  );
}
