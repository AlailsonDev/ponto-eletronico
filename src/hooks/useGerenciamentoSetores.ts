"use client";

import { useEffect, useState, useCallback } from "react";
import type { Setor } from "@/types/setor";
import { listarTodosSetores, criarSetor, atualizarSetor, type ConfiguracaoLocalSetor } from "@/services/setores.service";

export function useGerenciamentoSetores() {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      setSetores(await listarTodosSetores());
    } catch {
      setErro("Não foi possível carregar os setores.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function criar(dados: ConfiguracaoLocalSetor) {
    setEnviando(true);
    setErro(null);
    try {
      await criarSetor(dados);
      await carregar();
    } catch {
      setErro("Não foi possível criar o setor.");
    } finally {
      setEnviando(false);
    }
  }

  async function alternarAtivo(setor: Setor) {
    setErro(null);
    try {
      await atualizarSetor(setor.id, { ativo: !setor.ativo });
      await carregar();
    } catch {
      setErro("Não foi possível atualizar o setor.");
    }
  }

  async function renomear(setor: Setor, dados: ConfiguracaoLocalSetor) {
    setErro(null);
    try {
      await atualizarSetor(setor.id, dados);
      await carregar();
    } catch {
      setErro("Não foi possível renomear o setor.");
    }
  }

  return { setores, carregando, enviando, erro, criar, alternarAtivo, renomear };
}
