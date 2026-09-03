"use client";

import { useEffect, useState } from "react";
import type { Usuario } from "@/types/usuario";
import type { Retrospectiva } from "@/types/retrospectiva";
import { buscarRetrospectiva, registrarVisualizacaoRetrospectiva } from "@/services/retrospectiva.service";

export function useRetrospectiva(usuario: Usuario | null) {
  const [retrospectiva, setRetrospectiva] = useState<Retrospectiva | null>(null);
  const [aberta, setAberta] = useState(false);
  useEffect(() => {
    if (!usuario) return;
    buscarRetrospectiva().then((resultado) => {
      setRetrospectiva(resultado.retrospectiva);
      if (resultado.deveExibir) setAberta(true);
    }).catch(() => {});
  }, [usuario?.uid]);
  async function fechar() {
    if (!retrospectiva) return;
    setAberta(false);
    await registrarVisualizacaoRetrospectiva(retrospectiva.periodo);
  }
  return { retrospectiva, aberta, fechar, abrir: () => setAberta(true) };
}