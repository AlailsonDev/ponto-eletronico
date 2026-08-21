"use client";

import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { Setor } from "@/types/setor";

interface TabelaSetoresProps {
  setores: Setor[];
  onAlternarAtivo: (setor: Setor) => void;
  onRenomear: (setor: Setor, novoNome: string) => void;
}

export function TabelaSetores({ setores, onAlternarAtivo, onRenomear }: TabelaSetoresProps) {
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nomeEmEdicao, setNomeEmEdicao] = useState("");

  if (setores.length === 0) {
    return (
      <div className="rounded-card border border-surface-border bg-white p-8 text-center font-body text-sm text-ink-400">
        Nenhum setor cadastrado ainda.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-card border border-surface-border bg-white">
      <ul className="divide-y divide-surface-border">
        {setores.map((setor) => (
          <li key={setor.id} className="flex items-center justify-between gap-3 px-4 py-3">
            {editandoId === setor.id ? (
              <input
                autoFocus
                value={nomeEmEdicao}
                onChange={(e) => setNomeEmEdicao(e.target.value)}
                className="flex-1 rounded-card border border-teal-500 px-2.5 py-1.5 font-body text-sm outline-none"
              />
            ) : (
              <span className="font-body text-sm font-medium text-ink-900">{setor.nome}</span>
            )}

            <div className="flex items-center gap-2">
              <Badge cor={setor.ativo ? "green" : "neutral"}>
                {setor.ativo ? "Ativo" : "Inativo"}
              </Badge>

              {editandoId === setor.id ? (
                <>
                  <button
                    onClick={() => {
                      if (nomeEmEdicao.trim()) onRenomear(setor, nomeEmEdicao.trim());
                      setEditandoId(null);
                    }}
                    aria-label="Confirmar"
                    className="flex h-8 w-8 items-center justify-center rounded-card text-green-600 hover:bg-green-100"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditandoId(null)}
                    aria-label="Cancelar"
                    className="flex h-8 w-8 items-center justify-center rounded-card text-ink-400 hover:bg-surface"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setEditandoId(setor.id);
                    setNomeEmEdicao(setor.nome);
                  }}
                  aria-label="Editar nome"
                  className="flex h-8 w-8 items-center justify-center rounded-card text-ink-400 hover:bg-surface"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}

              <Button variant="secondary" onClick={() => onAlternarAtivo(setor)} className="px-3 py-1.5 text-xs">
                {setor.ativo ? "Desativar" : "Ativar"}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
