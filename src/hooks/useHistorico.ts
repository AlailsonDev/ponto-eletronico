"use client";

import { useEffect, useState, useCallback } from "react";
import type { Usuario } from "@/types/usuario";
import type { Jornada } from "@/types/jornada";
import type { RegistroPonto, ResumoJornadaDia } from "@/types/registroPonto";
import { buscarRegistrosPeriodo } from "@/services/ponto.service";
import { buscarJornada } from "@/services/jornadas.service";
import { calcularResumoDia } from "@/lib/calculoJornada";
import { limitesDoMes, mesAtualISO } from "@/lib/formatadores";

export function useHistorico(usuario: Usuario | null) {
  const [anoMesSelecionado, setAnoMesSelecionado] = useState(mesAtualISO());
  const [registros, setRegistros] = useState<RegistroPonto[]>([]);
  const [jornada, setJornada] = useState<Jornada | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [dataInicio, dataFim] = limitesDoMes(anoMesSelecionado);

  const carregar = useCallback(async () => {
    if (!usuario) return;
    setCarregando(true);
    setErro(null);
    try {
      const [registrosDoPeriodo, jornadaDoUsuario] = await Promise.all([
        buscarRegistrosPeriodo(usuario.uid, dataInicio, dataFim),
        // A jornada raramente muda — buscar de novo a cada consulta é
        // desperdício, mas manter cache entre meses é complexidade
        // desnecessária para 40 funcionários. Fica assim por simplicidade.
        usuario.jornadaId ? buscarJornada(usuario.jornadaId) : Promise.resolve(null),
      ]);
      setRegistros(registrosDoPeriodo);
      setJornada(jornadaDoUsuario);
    } catch {
      setErro("Não foi possível carregar seu histórico. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }, [usuario, dataInicio, dataFim]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Agrupa por data e calcula o resumo de cada dia — só aparecem dias que
  // têm ao menos um registro (evita listar todo dia útil do mês, incluindo
  // fins de semana/feriados, que a v1 ainda não sabe diferenciar).
  const registrosPorDia = new Map<string, RegistroPonto[]>();
  for (const registro of registros) {
    const lista = registrosPorDia.get(registro.data) ?? [];
    lista.push(registro);
    registrosPorDia.set(registro.data, lista);
  }

  const dias: ResumoJornadaDia[] = Array.from(registrosPorDia.entries())
    .sort((a, b) => b[0].localeCompare(a[0])) // mais recente primeiro
    .map(([data, registrosDoDia]) => calcularResumoDia(data, registrosDoDia, jornada));

  return {
    dias,
    anoMesSelecionado,
    setAnoMesSelecionado,
    carregando,
    erro,
  };
}
