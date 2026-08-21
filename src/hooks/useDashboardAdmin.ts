"use client";

import { useEffect, useMemo, useState } from "react";
import type { Usuario } from "@/types/usuario";
import type { Jornada } from "@/types/jornada";
import type { RegistroPonto } from "@/types/registroPonto";
import { listarFuncionarios } from "@/services/usuarios.service";
import { listarJornadas } from "@/services/jornadas.service";
import { observarRegistrosDoDiaTodos } from "@/services/ponto.service";
import { dataHojeISO } from "@/lib/formatadores";
import {
  calcularStatusFuncionario,
  calcularContadores,
  type StatusFuncionarioHoje,
} from "@/lib/statusFuncionarioHoje";
import { useRelogio } from "@/hooks/useRelogio";

export interface FuncionarioComStatus {
  usuario: Usuario;
  status: StatusFuncionarioHoje;
}

export function useDashboardAdmin() {
  const [funcionarios, setFuncionarios] = useState<Usuario[]>([]);
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [registrosHoje, setRegistrosHoje] = useState<RegistroPonto[]>([]);
  const [carregandoBase, setCarregandoBase] = useState(true);
  const [carregandoRegistros, setCarregandoRegistros] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const agora = useRelogio();
  const hoje = dataHojeISO();

  // Funcionários e jornadas mudam pouco ao longo do dia — busca única
  // (não realtime), evita listeners desnecessários.
  useEffect(() => {
    let cancelado = false;
    setCarregandoBase(true);
    Promise.all([listarFuncionarios(), listarJornadas()])
      .then(([f, j]) => {
        if (cancelado) return;
        setFuncionarios(f);
        setJornadas(j);
      })
      .catch(() => {
        if (!cancelado) setErro("Não foi possível carregar os dados dos funcionários.");
      })
      .finally(() => {
        if (!cancelado) setCarregandoBase(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  // Único listener em tempo real: todos os registros de hoje.
  useEffect(() => {
    setCarregandoRegistros(true);
    const unsubscribe = observarRegistrosDoDiaTodos(
      hoje,
      (registros) => {
        setRegistrosHoje(registros);
        setCarregandoRegistros(false);
      },
      () => {
        setErro("Não foi possível carregar os registros de hoje.");
        setCarregandoRegistros(false);
      }
    );
    return () => unsubscribe();
  }, [hoje]);

  const jornadasPorId = useMemo(() => {
    const mapa = new Map<string, Jornada>();
    for (const j of jornadas) mapa.set(j.id, j);
    return mapa;
  }, [jornadas]);

  const registrosPorUsuario = useMemo(() => {
    const mapa = new Map<string, RegistroPonto[]>();
    for (const registro of registrosHoje) {
      const lista = mapa.get(registro.usuarioId) ?? [];
      lista.push(registro);
      mapa.set(registro.usuarioId, lista);
    }
    return mapa;
  }, [registrosHoje]);

  const funcionariosComStatus: FuncionarioComStatus[] = useMemo(() => {
    if (!agora) return [];
    return funcionarios
      .filter((f) => f.status === "ativo")
      .map((usuario) => {
        const registrosDoUsuario = registrosPorUsuario.get(usuario.uid) ?? [];
        const jornada = jornadasPorId.get(usuario.jornadaId) ?? null;
        return {
          usuario,
          status: calcularStatusFuncionario(registrosDoUsuario, jornada, agora),
        };
      });
  }, [funcionarios, registrosPorUsuario, jornadasPorId, agora]);

  const contadores = useMemo(
    () => calcularContadores(funcionariosComStatus.map((f) => f.status)),
    [funcionariosComStatus]
  );

  return {
    funcionariosComStatus,
    contadores,
    totalCadastrados: funcionarios.length,
    carregando: carregandoBase || carregandoRegistros || !agora,
    erro,
  };
}
