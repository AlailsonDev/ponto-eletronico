"use client";

import { useEffect, useState, useCallback } from "react";
import { Timestamp } from "firebase/firestore";
import type { Setor } from "@/types/setor";
import type { Jornada } from "@/types/jornada";
import type { EditarUsuarioInput, NovoUsuarioInput, Usuario } from "@/types/usuario";
import { listarSetoresAtivos } from "@/services/setores.service";
import { listarJornadas } from "@/services/jornadas.service";
import { criarFuncionario, desativarFuncionario, editarFuncionario, listarFuncionarios } from "@/services/usuarios.service";

export function useCadastroFuncionarios() {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [funcionarios, setFuncionarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const [setoresCarregados, jornadasCarregadas, funcionariosCarregados] = await Promise.all([
        listarSetoresAtivos(),
        listarJornadas(),
        listarFuncionarios(),
      ]);
      setSetores(setoresCarregados);
      setJornadas(jornadasCarregadas);
      setFuncionarios(funcionariosCarregados);
    } catch {
      setErro("Não foi possível carregar os dados. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function cadastrar(input: NovoUsuarioInput) {
    setErro(null);
    setSucesso(null);
    setEnviando(true);
    try {
      await criarFuncionario(input);
      setSucesso(`Funcionário "${input.nome}" cadastrado com sucesso.`);
      await carregar(); // recarrega a lista para refletir o novo funcionário
    } catch (err) {
      setErro((err as Error)?.message ?? "Não foi possível cadastrar o funcionário.");
    } finally {
      setEnviando(false);
    }
  }

  async function desativar(uid: string) {
    setErro(null);
    setSucesso(null);
    setEnviando(true);
    try {
      await desativarFuncionario(uid);
      setFuncionarios((atuais) =>
        atuais.map((item) => (item.uid === uid ? { ...item, status: "inativo" } : item))
      );
      setSucesso("Funcionário desativado com sucesso.");
    } catch (err) {
      setErro((err as Error)?.message ?? "Não foi possível desativar o funcionário.");
    } finally {
      setEnviando(false);
    }
  }

  async function editar(uid: string, input: EditarUsuarioInput) {
    setErro(null);
    setSucesso(null);
    setEnviando(true);
    try {
      await editarFuncionario(uid, input);
      setFuncionarios((atuais) => atuais.map((item) => item.uid === uid ? {
        ...item,
        ...input,
        dataAdmissao: Timestamp.fromDate(new Date(input.dataAdmissao)),
      } : item));
      setSucesso(`Funcionário "${input.nome}" atualizado com sucesso.`);
    } catch (err) {
      setErro((err as Error)?.message ?? "Não foi possível editar o funcionário.");
    } finally {
      setEnviando(false);
    }
  }

  return {
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
    limparMensagens: () => {
      setErro(null);
      setSucesso(null);
    },
  };
}
