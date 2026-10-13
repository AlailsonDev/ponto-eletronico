"use client";

import { useEffect, useState, useCallback } from "react";
import type { Usuario } from "@/types/usuario";
import { diasTrabalhoDaJornada, type Jornada } from "@/types/jornada";
import type { RegistroPonto, ResumoJornadaDia } from "@/types/registroPonto";
import { buscarRegistrosPeriodo } from "@/services/ponto.service";
import { buscarJornada } from "@/services/jornadas.service";
import { calcularResumoDia } from "@/lib/calculoJornada";
import { dataHojeISO, limitesDoMes, mesAtualISO } from "@/lib/formatadores";

/** Datas ("YYYY-MM-DD") que são dia de trabalho previsto, dentro do intervalo. */
function listarDiasPrevistos(dataInicioISO: string, dataFimISO: string, diasTrabalho: Set<number>): string[] {
  const dias: string[] = [];
  let atual = new Date(`${dataInicioISO}T12:00:00`);
  const fimData = new Date(`${dataFimISO}T12:00:00`);
  while (atual <= fimData) {
    if (diasTrabalho.has(atual.getDay())) {
      dias.push(`${atual.getFullYear()}-${String(atual.getMonth() + 1).padStart(2, "0")}-${String(atual.getDate()).padStart(2, "0")}`);
    }
    atual = new Date(atual.getFullYear(), atual.getMonth(), atual.getDate() + 1, 12);
  }
  return dias;
}

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

  // Agrupa por data e calcula o resumo de cada dia.
  const registrosPorDia = new Map<string, RegistroPonto[]>();
  for (const registro of registros) {
    const lista = registrosPorDia.get(registro.data) ?? [];
    lista.push(registro);
    registrosPorDia.set(registro.data, lista);
  }

  // Dias úteis já passados (até hoje) sem nenhum registro também aparecem —
  // com tudo em branco e marcados "Incompleto" — para o funcionário notar de
  // cara onde esqueceu de bater e já solicitar a correção. Dias futuros do
  // mês selecionado não entram (ainda não aconteceram).
  const hoje = dataHojeISO();
  const diasTrabalho = new Set(diasTrabalhoDaJornada(jornada));
  const diasPrevistosAteHoje = listarDiasPrevistos(dataInicio, dataFim, diasTrabalho).filter((data) => data <= hoje);
  for (const data of diasPrevistosAteHoje) {
    if (!registrosPorDia.has(data)) registrosPorDia.set(data, []);
  }

  const dias: ResumoJornadaDia[] = Array.from(registrosPorDia.entries())
    .sort((a, b) => b[0].localeCompare(a[0])) // mais recente primeiro
    .map(([data, registrosDoDia]) => calcularResumoDia(data, registrosDoDia, jornada));

  return {
    dias,
    registros,
    anoMesSelecionado,
    setAnoMesSelecionado,
    carregando,
    erro,
  };
}
