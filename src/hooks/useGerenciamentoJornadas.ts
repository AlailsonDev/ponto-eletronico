"use client";

import { useEffect, useState, useCallback } from "react";
import type { Jornada } from "@/types/jornada";
import {
  listarJornadas,
  criarJornada,
  atualizarJornada,
  excluirJornada,
  type DadosJornada,
} from "@/services/jornadas.service";

export function useGerenciamentoJornadas() {
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      setJornadas(await listarJornadas());
    } catch {
      setErro("Não foi possível carregar as jornadas.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function criar(dados: DadosJornada) {
    setEnviando(true);
    setErro(null);
    try {
      await criarJornada(dados);
      await carregar();
    } catch {
      setErro("Não foi possível criar a jornada.");
    } finally {
      setEnviando(false);
    }
  }

  async function editar(id: string, dados: DadosJornada) {
    setEnviando(true);
    setErro(null);
    try {
      await atualizarJornada(id, dados);
      await carregar();
    } catch {
      setErro("Não foi possível atualizar a jornada.");
    } finally {
      setEnviando(false);
    }
  }

  async function excluir(id: string) {
    setEnviando(true);
    setErro(null);
    try {
      await excluirJornada(id);
      await carregar();
    } catch {
      setErro("Não foi possível excluir a jornada.");
    } finally {
      setEnviando(false);
    }
  }

  return { jornadas, carregando, enviando, erro, criar, editar, excluir };
}
