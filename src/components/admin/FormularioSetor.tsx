"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function FormularioSetor({
  enviando,
  onSubmit,
}: {
  enviando: boolean;
  onSubmit: (nome: string) => void;
}) {
  const [nome, setNome] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!nome.trim()) return;
    onSubmit(nome.trim());
    setNome("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-1">
        <Input
          label="Nome do setor"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Transparência"
          required
        />
      </div>
      <Button type="submit" carregando={enviando} className="mb-[1px]">
        Adicionar
      </Button>
    </form>
  );
}
