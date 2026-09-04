"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Setor } from "@/types/setor";
import { RAIO_PADRAO_METROS } from "@/lib/geolocalizacao";

export function FormularioSetor({
  enviando,
  onSubmit,
  setor,
}: {
  enviando: boolean;
  onSubmit: (dados: { nome: string; ativo: boolean; latitude: number; longitude: number; raioMetros: number }) => void;
  setor?: Setor | null;
}) {
  const [nome, setNome] = useState(setor?.nome ?? "");
  const [latitude, setLatitude] = useState(String(setor?.latitude ?? ""));
  const [longitude, setLongitude] = useState(String(setor?.longitude ?? ""));
  const [raioMetros, setRaioMetros] = useState(String(setor?.raioMetros ?? RAIO_PADRAO_METROS));

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const dados = { nome: nome.trim(), ativo: setor?.ativo ?? true, latitude: Number(latitude), longitude: Number(longitude), raioMetros: Number(raioMetros) };
    if (!dados.nome || !Number.isFinite(dados.latitude) || !Number.isFinite(dados.longitude) || !Number.isFinite(dados.raioMetros)) return;
    onSubmit(dados);
    if (!setor) { setNome(""); setLatitude(""); setLongitude(""); setRaioMetros(String(RAIO_PADRAO_METROS)); }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="flex-1">
        <Input
          label="Nome do setor"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Transparência"
          required
        />
      </div>
      <Input label="Latitude" type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} required placeholder="Ex: -8.0476" />
      <Input label="Longitude" type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} required placeholder="Ex: -34.8770" />
      <Input label="Raio permitido (metros)" type="number" min="1" value={raioMetros} onChange={(e) => setRaioMetros(e.target.value)} required />
      <Button type="submit" carregando={enviando} className="sm:mb-[1px]">
        {setor ? "Salvar configuração" : "Adicionar setor"}
      </Button>
    </form>
  );
}
