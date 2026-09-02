"use client";

import { useEffect, useState } from "react";
import {
  Accessibility,
  Contrast,
  Minus,
  Plus,
  RotateCcw,
  Type,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const FONT_SIZES = ["normal", "large", "larger"] as const;
type FontSize = (typeof FONT_SIZES)[number];

export function AccessibilityWidget() {
  const { firebaseUser, perfil, emailVerificado, sessaoInvalida } = useAuth();
  const autenticado = Boolean(firebaseUser && perfil && emailVerificado && !sessaoInvalida);
  const [aberto, setAberto] = useState(false);
  const [tamanhoFonte, setTamanhoFonte] = useState<FontSize>("normal");
  const [altoContraste, setAltoContraste] = useState(false);

  useEffect(() => {
    if (!autenticado) return;

    const tamanhoSalvo = window.localStorage.getItem("acessibilidade-fonte") as FontSize | null;
    const contrasteSalvo = window.localStorage.getItem("acessibilidade-contraste") === "true";
    if (tamanhoSalvo && FONT_SIZES.includes(tamanhoSalvo)) setTamanhoFonte(tamanhoSalvo);
    setAltoContraste(contrasteSalvo);
  }, [autenticado]);

  useEffect(() => {
    if (!autenticado) {
      delete document.documentElement.dataset.fontSize;
      delete document.documentElement.dataset.highContrast;
      return;
    }

    document.documentElement.dataset.fontSize = tamanhoFonte;
    window.localStorage.setItem("acessibilidade-fonte", tamanhoFonte);
  }, [autenticado, tamanhoFonte]);

  useEffect(() => {
    if (!autenticado) {
      delete document.documentElement.dataset.highContrast;
      return;
    }

    document.documentElement.dataset.highContrast = String(altoContraste);
    window.localStorage.setItem("acessibilidade-contraste", String(altoContraste));
  }, [altoContraste, autenticado]);

  useEffect(() => {
    return () => {
      delete document.documentElement.dataset.fontSize;
      delete document.documentElement.dataset.highContrast;
    };
  }, []);

  function ajustarFonte(direcao: 1 | -1) {
    const indiceAtual = FONT_SIZES.indexOf(tamanhoFonte);
    const novoIndice = Math.max(0, Math.min(FONT_SIZES.length - 1, indiceAtual + direcao));
    setTamanhoFonte(FONT_SIZES[novoIndice]);
  }

  function restaurarPadrao() {
    setTamanhoFonte("normal");
    setAltoContraste(false);
  }

  if (!autenticado) return null;

  return (
    <div data-accessibility-widget className="fixed right-0 top-1/2 z-50 -translate-y-1/2">
      {aberto && (
        <section
          id="painel-acessibilidade"
          aria-label="Opções de acessibilidade"
          className="absolute right-14 top-1/2 w-64 -translate-y-1/2 rounded-card border border-surface-border bg-white p-4 text-ink-900 shadow-xl"
        >
          <div className="mb-4 flex items-center justify-between border-b border-surface-border pb-3">
            <h2 className="font-display text-sm font-semibold">Acessibilidade</h2>
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar opções de acessibilidade"
              className="flex h-8 w-8 items-center justify-center rounded-card text-ink-400 hover:bg-surface hover:text-ink-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <p className="mb-2 flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-wide text-ink-600">
                <Type className="h-4 w-4" /> Tamanho do texto
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => ajustarFonte(-1)}
                  disabled={tamanhoFonte === "normal"}
                  className="flex items-center justify-center gap-2 rounded-card border border-surface-border px-3 py-2 font-body text-sm hover:border-navy-600 hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Minus className="h-4 w-4" /> Diminuir
                </button>
                <button
                  type="button"
                  onClick={() => ajustarFonte(1)}
                  disabled={tamanhoFonte === "larger"}
                  className="flex items-center justify-center gap-2 rounded-card border border-surface-border px-3 py-2 font-body text-sm hover:border-navy-600 hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" /> Aumentar
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setAltoContraste((ativo) => !ativo)}
              aria-pressed={altoContraste}
              className="flex w-full items-center justify-between rounded-card border border-surface-border px-3 py-2.5 text-left font-body text-sm hover:border-navy-600 hover:bg-surface"
            >
              <span className="flex items-center gap-2"><Contrast className="h-4 w-4" /> Alto contraste</span>
              <span className="text-xs font-semibold text-navy-700">{altoContraste ? "Ativo" : "Inativo"}</span>
            </button>

            <button
              type="button"
              onClick={restaurarPadrao}
              disabled={tamanhoFonte === "normal" && !altoContraste}
              className="flex items-center justify-center gap-2 rounded-card px-3 py-2 font-body text-sm text-navy-700 hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw className="h-4 w-4" /> Restaurar padrão
            </button>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setAberto((estado) => !estado)}
        aria-expanded={aberto}
        aria-controls="painel-acessibilidade"
        aria-label={aberto ? "Fechar acessibilidade" : "Abrir acessibilidade"}
        title="Acessibilidade"
        className="flex h-14 w-14 items-center justify-center rounded-l-card border-2 border-r-0 border-yellow-300 bg-navy-800 text-yellow-300 shadow-lg transition-colors hover:bg-navy-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300"
      >
        <Accessibility className="h-7 w-7" />
      </button>
    </div>
  );
}
