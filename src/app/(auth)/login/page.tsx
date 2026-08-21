"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Clock3, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { login, traduzirErroFirebase, buscarPerfilUsuario, solicitarRecuperacaoSenha } from "@/services/auth.service";
import { rotaPadraoPorPerfil } from "@/components/layout/ProtectedRoute";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [modoRecuperacao, setModoRecuperacao] = useState(false);
  const [mensagemRecuperacao, setMensagemRecuperacao] = useState<string | null>(null);
  const [agora, setAgora] = useState<Date | null>(null);

  // Relógio local é só decorativo/informativo aqui — o timestamp que
  // efetivamente conta para o ponto vem sempre do serverTimestamp() do Firestore.
  useEffect(() => {
    setAgora(new Date());
    const intervalo = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(intervalo);
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      const user = await login(email, senha);
      const perfilUsuario = await buscarPerfilUsuario(user.uid);

      if (!perfilUsuario || perfilUsuario.status !== "ativo") {
        setErro("Sua conta está inativa. Procure o administrador do sistema.");
        setCarregando(false);
        return;
      }

      router.push(rotaPadraoPorPerfil(perfilUsuario.perfil));
    } catch (err) {
      const codigo = (err as { code?: string })?.code ?? "";
      setErro(traduzirErroFirebase(codigo));
      setCarregando(false);
    }
  }

  async function handleRecuperacao(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setMensagemRecuperacao(null);
    setCarregando(true);

    try {
      await solicitarRecuperacaoSenha(email);
      setMensagemRecuperacao("Se este e-mail estiver cadastrado, enviamos um link de redefinição.");
    } catch {
      // Mesma mensagem em caso de erro, para não revelar se o e-mail existe.
      setMensagemRecuperacao("Se este e-mail estiver cadastrado, enviamos um link de redefinição.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="grid min-h-screen font-body md:grid-cols-2">
      {/* Painel institucional */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-navy-900 p-12 text-white md:flex">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-teal-500" />
          <span className="font-display text-sm font-semibold tracking-wide">
            SISTEMA DE PONTO ELETRÔNICO
          </span>
        </div>

        <div>
          <div className="flex items-center gap-2 text-navy-950/0">
            <Clock3 className="h-8 w-8 text-teal-500" />
          </div>
          <p
            className="font-mono text-6xl font-light tabular-nums text-white"
            aria-live="polite"
          >
            {agora
              ? agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
              : "--:--:--"}
          </p>
          <p className="mt-2 font-body text-sm text-white/60">
            {agora
              ? agora.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
              : ""}
          </p>
          <p className="mt-6 max-w-sm font-body text-sm leading-relaxed text-white/50">
            Todo registro de ponto é gravado com o horário do servidor, não com o
            relógio do seu dispositivo — o que garante integridade e auditabilidade
            dos registros.
          </p>
        </div>

        <p className="font-body text-xs text-white/40">
          Acesso restrito aos servidores da CGM do município do Jaboatão dos Guararapes.
        </p>
      </div>

      {/* Formulário */}
      <div className="flex items-center justify-center bg-surface p-6 md:p-12">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-semibold text-ink-900">
            {modoRecuperacao ? "Recuperar senha" : "Entrar"}
          </h1>
          <p className="mt-1 mb-8 font-body text-sm text-ink-600">
            {modoRecuperacao
              ? "Informe seu e-mail cadastrado para receber o link de redefinição."
              : "Use sua matrícula ou e-mail institucional."}
          </p>

          {!modoRecuperacao ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              <Input
                label="E-mail"
                type="email"
                name="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome.sobrenome@jaboatao.pe.gov.br"
              />

              <div className="relative">
                <Input
                  label="Senha"
                  type={mostrarSenha ? "text" : "password"}
                  name="senha"
                  autoComplete="current-password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  className="absolute right-3.5 top-[38px] text-ink-400 hover:text-ink-600"
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {erro && (
                <div role="alert" className="rounded-card border border-red-600/20 bg-red-100 px-3.5 py-2.5 font-body text-sm text-red-600">
                  {erro}
                </div>
              )}

              <Button type="submit" carregando={carregando} className="mt-2 w-full">
                {carregando ? "Entrando…" : "Entrar"}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setModoRecuperacao(true);
                  setErro(null);
                }}
                className="mt-1 self-center font-body text-sm text-navy-700 hover:underline"
              >
                Esqueci minha senha
              </button>
            </form>
          ) : (
            <form onSubmit={handleRecuperacao} className="flex flex-col gap-4" noValidate>
              <Input
                label="E-mail"
                type="email"
                name="email-recuperacao"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome.sobrenome@jaboatao.pe.gov.br"
              />

              {mensagemRecuperacao && (
                <div className="rounded-card border border-green-600/20 bg-green-100 px-3.5 py-2.5 font-body text-sm text-green-600">
                  {mensagemRecuperacao}
                </div>
              )}

              <Button type="submit" carregando={carregando} className="w-full">
                Enviar link de redefinição
              </Button>

              <button
                type="button"
                onClick={() => {
                  setModoRecuperacao(false);
                  setMensagemRecuperacao(null);
                  setErro(null);
                }}
                className="self-center font-body text-sm text-navy-700 hover:underline"
              >
                Voltar ao login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
