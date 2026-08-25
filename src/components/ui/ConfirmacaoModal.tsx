"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ConfirmacaoModalProps {
  aberto: boolean;
  titulo: string;
  mensagem: string;
  textoConfirmar?: string;
  variante?: "primary" | "danger";
  onConfirmar: () => void;
  onCancelar: () => void;
}

export function ConfirmacaoModal({
  aberto,
  titulo,
  mensagem,
  textoConfirmar = "Confirmar",
  variante = "primary",
  onConfirmar,
  onCancelar,
}: ConfirmacaoModalProps) {
  const cancelarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!aberto) return;

    cancelarRef.current?.focus();
    function aoPressionarTecla(event: KeyboardEvent) {
      if (event.key === "Escape") onCancelar();
    }

    document.addEventListener("keydown", aoPressionarTecla);
    return () => document.removeEventListener("keydown", aoPressionarTecla);
  }, [aberto, onCancelar]);

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/55 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancelar();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmacao-modal-titulo"
        aria-describedby="confirmacao-modal-mensagem"
        className="w-full max-w-md rounded-card border border-surface-border bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-4">
              <h2 id="confirmacao-modal-titulo" className="font-display text-lg font-semibold text-ink-900">
                {titulo}
              </h2>
              <button
                type="button"
                onClick={onCancelar}
                aria-label="Fechar confirmação"
                className="shrink-0 rounded p-1 text-ink-400 transition-colors hover:bg-surface hover:text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p id="confirmacao-modal-mensagem" className="mt-2 font-body text-sm leading-6 text-ink-600">
              {mensagem}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button ref={cancelarRef} type="button" variant="secondary" onClick={onCancelar}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onConfirmar}
            className={variante === "danger" ? "bg-red-600 hover:bg-red-600/90" : undefined}
          >
            {textoConfirmar}
          </Button>
        </div>
      </div>
    </div>
  );
}
