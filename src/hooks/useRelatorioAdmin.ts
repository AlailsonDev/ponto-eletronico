"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useMemo, useState } from "react";
import type { Jornada } from "@/types/jornada";
import type { RegistroPonto, SolicitacaoCorrecao } from "@/types/registroPonto";
import type { Usuario } from "@/types/usuario";
import { listarFuncionariosParaRelatorio } from "@/services/usuarios.service";
import { listarJornadas } from "@/services/jornadas.service";
import { buscarAusenciasAprovadas, buscarRegistrosParaRelatorio } from "@/services/ponto.service";
import { calcularResumoDia } from "@/lib/calculoJornada";
import { limitesDoMes, mesAtualISO } from "@/lib/formatadores";
import { mesclarComAusencias, type DiaComAusencia } from "@/lib/mesclarAusencias";

export interface LinhaRelatorio {
  usuario: Usuario;
  dias: DiaComAusencia[];
  diasComRegistro: number;
  diasIncompletos: number;
  minutosTrabalhados: number;
  minutosAtraso: number;
  minutosHoraExtra: number;
}

export function useRelatorioAdmin() {
  const { perfil, firebaseUser } = useAuth();
  const [anoMesSelecionado, setAnoMesSelecionado] = useState(mesAtualISO());
  const [funcionarios, setFuncionarios] = useState<Usuario[]>([]);
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [registros, setRegistros] = useState<RegistroPonto[]>([]);
  const [ausencias, setAusencias] = useState<SolicitacaoCorrecao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [dataInicio, dataFim] = limitesDoMes(anoMesSelecionado);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);

    if (!perfil || !firebaseUser) return () => { cancelado = true; };

    const setorId = perfil.perfil === "gestor" ? perfil.setorId : undefined;
    Promise.all([
      listarFuncionariosParaRelatorio(setorId),
      listarJornadas(),
      buscarRegistrosParaRelatorio(dataInicio, dataFim, setorId),
      firebaseUser.getIdToken().then((idToken) => buscarAusenciasAprovadas(dataInicio, dataFim, idToken)),
    ])
      .then(([funcionariosCarregados, jornadasCarregadas, registrosCarregados, ausenciasCarregadas]) => {
        if (cancelado) return;
        setFuncionarios(funcionariosCarregados);
        setJornadas(jornadasCarregadas);
        setRegistros(registrosCarregados);
        setAusencias(ausenciasCarregadas);
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
  }, [dataInicio, dataFim, perfil, firebaseUser]);

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
    const ausenciasPorUsuario = new Map<string, SolicitacaoCorrecao[]>();
    for (const ausencia of ausencias) {
      const lista = ausenciasPorUsuario.get(ausencia.usuarioId) ?? [];
      lista.push(ausencia);
      ausenciasPorUsuario.set(ausencia.usuarioId, lista);
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
      // Dias só com ausência (nenhum registro de ponto) entram aqui para o
      // detalhamento diário mostrar o motivo — não contam em
      // diasComRegistro/diasIncompletos, que continuam medindo pontos reais.
      const diasComAusencia = mesclarComAusencias(dias, ausenciasPorUsuario.get(usuario.uid) ?? [])
        .sort((a, b) => a.data.localeCompare(b.data));

      return {
        usuario,
        dias: diasComAusencia,
        diasComRegistro: dias.length,
        diasIncompletos: dias.filter((dia) => dia.incompleta).length,
        minutosTrabalhados: dias.reduce((total, dia) => total + (dia.minutosTrabalhados ?? 0), 0),
        minutosAtraso: dias.reduce((total, dia) => total + (dia.minutosAtraso ?? 0), 0),
        minutosHoraExtra: dias.reduce((total, dia) => total + (dia.minutosHoraExtra ?? 0), 0),
      };
    });
  }, [funcionarios, jornadasPorId, registros, ausencias]);

  return {
    anoMesSelecionado,
    setAnoMesSelecionado,
    linhas,
    carregando,
    erro,
  };
}
