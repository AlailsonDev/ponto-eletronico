"use client";

import { useEffect, useMemo, useState } from "react";
import type { Jornada } from "@/types/jornada";
import type { RegistroPonto, ResumoJornadaDia } from "@/types/registroPonto";
import type { Usuario } from "@/types/usuario";
import { listarFuncionarios } from "@/services/usuarios.service";
import { listarJornadas } from "@/services/jornadas.service";
import { buscarTodosRegistrosPeriodo } from "@/services/ponto.service";
import { calcularResumoDia } from "@/lib/calculoJornada";
import { limitesDoMes, mesAtualISO } from "@/lib/formatadores";

export interface LinhaRelatorio {
  usuario: Usuario;
  dias: ResumoJornadaDia[];
  diasComRegistro: number;
  diasIncompletos: number;
  minutosTrabalhados: number;
  minutosAtraso: number;
  minutosHoraExtra: number;
}

export function useRelatorioAdmin() {
  const [anoMesSelecionado, setAnoMesSelecionado] = useState(mesAtualISO());
  const [funcionarios, setFuncionarios] = useState<Usuario[]>([]);
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [registros, setRegistros] = useState<RegistroPonto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [dataInicio, dataFim] = limitesDoMes(anoMesSelecionado);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);

    Promise.all([
      listarFuncionarios(),
      listarJornadas(),
      buscarTodosRegistrosPeriodo(dataInicio, dataFim),
    ])
      .then(([funcionariosCarregados, jornadasCarregadas, registrosCarregados]) => {
        if (cancelado) return;
        setFuncionarios(funcionariosCarregados);
        setJornadas(jornadasCarregadas);
        setRegistros(registrosCarregados);
      })
      .catch(() => {
        if (!cancelado) setErro("Não foi possível carregar o relatório. Tente novamente.");
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [dataInicio, dataFim]);

  const jornadasPorId = useMemo(() => {
    const mapa = new Map<string, Jornada>();
    for (const jornada of jornadas) mapa.set(jornada.id, jornada);
    return mapa;
  }, [jornadas]);

  const linhas = useMemo<LinhaRelatorio[]>(() => {
    const registrosPorUsuario = new Map<string, RegistroPonto[]>();
    for (const registro of registros) {
      const lista = registrosPorUsuario.get(registro.usuarioId) ?? [];
      lista.push(registro);
      registrosPorUsuario.set(registro.usuarioId, lista);
    }

    return funcionarios.map((usuario) => {
      const registrosDoUsuario = registrosPorUsuario.get(usuario.uid) ?? [];
      const registrosPorDia = new Map<string, RegistroPonto[]>();
      for (const registro of registrosDoUsuario) {
        const lista = registrosPorDia.get(registro.data) ?? [];
        lista.push(registro);
        registrosPorDia.set(registro.data, lista);
      }

      const jornada = usuario.jornadaId ? jornadasPorId.get(usuario.jornadaId) ?? null : null;
      const dias = Array.from(registrosPorDia.entries())
        .sort(([dataA], [dataB]) => dataA.localeCompare(dataB))
        .map(([data, registrosDoDia]) => calcularResumoDia(data, registrosDoDia, jornada));

      return {
        usuario,
        dias,
        diasComRegistro: dias.length,
        diasIncompletos: dias.filter((dia) => dia.incompleta).length,
        minutosTrabalhados: dias.reduce((total, dia) => total + (dia.minutosTrabalhados ?? 0), 0),
        minutosAtraso: dias.reduce((total, dia) => total + (dia.minutosAtraso ?? 0), 0),
        minutosHoraExtra: dias.reduce((total, dia) => total + (dia.minutosHoraExtra ?? 0), 0),
      };
    });
  }, [funcionarios, jornadasPorId, registros]);

  return {
    anoMesSelecionado,
    setAnoMesSelecionado,
    linhas,
    carregando,
    erro,
  };
}
