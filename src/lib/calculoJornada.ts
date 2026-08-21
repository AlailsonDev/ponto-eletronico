import type { Jornada } from "@/types/jornada";
import type { RegistroPonto, ResumoJornadaDia } from "@/types/registroPonto";
import { horarioParaMinutos, timestampParaMinutosDoDia } from "@/lib/formatadores";

/**
 * Monta o resumo do dia a partir dos registros brutos + a jornada configurada
 * do funcionário. Todos os cálculos usam os timestamps do servidor
 * (já materializados nos documentos) — nunca o relógio do navegador.
 */
export function calcularResumoDia(
  data: string,
  registros: RegistroPonto[],
  jornada: Jornada | null
): ResumoJornadaDia {
  const entrada = registros.find((r) => r.tipo === "ENTRADA");
  const saidaAlmoco = registros.find((r) => r.tipo === "SAIDA_ALMOCO");
  const retornoAlmoco = registros.find((r) => r.tipo === "RETORNO_ALMOCO");
  const saida = registros.find((r) => r.tipo === "SAIDA");

  const resumo: ResumoJornadaDia = {
    data,
    entrada,
    saidaAlmoco,
    retornoAlmoco,
    saida,
    incompleta: false,
  };

  // Sem jornada configurada, não há como calcular atraso/hora extra —
  // ainda assim mostramos os horários batidos.
  if (!jornada) return resumo;

  // Minutos de intervalo (só computável se os dois marcos do almoço existem)
  if (saidaAlmoco?.dataHora && retornoAlmoco?.dataHora) {
    const retornoMinutos = timestampParaMinutosDoDia(retornoAlmoco.dataHora);
    const saidaAlmocoMinutos = timestampParaMinutosDoDia(saidaAlmoco.dataHora);
    if (retornoMinutos !== undefined && saidaAlmocoMinutos !== undefined) {
      resumo.minutosIntervalo = retornoMinutos - saidaAlmocoMinutos;
    }
  }

  // Minutos trabalhados = (saída - entrada) - intervalo de almoço
  if (entrada?.dataHora && saida?.dataHora) {
    const saidaMinutos = timestampParaMinutosDoDia(saida.dataHora);
    const entradaMinutos = timestampParaMinutosDoDia(entrada.dataHora);
    if (saidaMinutos !== undefined && entradaMinutos !== undefined) {
      const bruto = saidaMinutos - entradaMinutos;
      resumo.minutosTrabalhados = Math.max(0, bruto - (resumo.minutosIntervalo ?? 0));
    }
  }

  // Atraso: entrada real vs. horário previsto + tolerância
  if (entrada?.dataHora) {
    const entradaPrevistaMin = horarioParaMinutos(jornada.entrada) + jornada.toleranciaMinutos;
    const entradaRealMin = timestampParaMinutosDoDia(entrada.dataHora);
    if (entradaRealMin !== undefined) {
      resumo.minutosAtraso = Math.max(0, entradaRealMin - entradaPrevistaMin);
    }
  }

  // Hora extra: só faz sentido calcular com a jornada completa
  if (resumo.minutosTrabalhados !== undefined) {
    resumo.minutosHoraExtra = Math.max(
      0,
      resumo.minutosTrabalhados - jornada.cargaHorariaDiariaMinutos
    );
  }

  // Jornada incompleta: dia já passou (não é hoje) e falta algum dos 4 marcos.
  const ehDataPassada = data < new Date().toISOString().slice(0, 10);
  resumo.incompleta = ehDataPassada && !(entrada && saidaAlmoco && retornoAlmoco && saida);

  return resumo;
}
