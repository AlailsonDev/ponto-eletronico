import type { Jornada } from "@/types/jornada";
import { diasTrabalhoDaJornada } from "@/types/jornada";
import type { RegistroPonto, ResumoJornadaDia } from "@/types/registroPonto";
import type { InsigniaRegularidade, NivelInsignia } from "@/types/retrospectiva";
import { calcularResumoDia } from "@/lib/calculoJornada";
import { limitesDoMes } from "@/lib/formatadores";

export const REGULARIDADE_PESOS = { pontualidade: 0.4, jornada: 0.4, ocorrencias: 0.2 } as const;

/**
 * Primeiro mês ("YYYY-MM") que gera retrospectiva. Meses anteriores ficaram
 * na fase de testes da funcionalidade e não devem render retrospectiva nem
 * insígnia — setembro/2026 é o primeiro período valendo de verdade, exibido
 * a partir do primeiro dia útil de outubro/2026.
 */
export const PRIMEIRO_PERIODO_RETROSPECTIVA = "2026-09";

/**
 * Primeiro dia útil do mês: segunda a sexta, exceto feriados cadastrados na
 * coleção "feriados". A partir dele a retrospectiva do mês anterior — já
 * encerrado — fica disponível.
 */
export function primeiroDiaUtilDoMes(ano: number, mes: number, feriados: Set<string>): string {
  const data = new Date(ano, mes - 1, 1, 12);
  while (data.getDay() === 0 || data.getDay() === 6 || feriados.has(formatarISO(data))) data.setDate(data.getDate() + 1);
  return formatarISO(data);
}

export const FAIXAS_INSIGNIAS: Array<InsigniaRegularidade & { level: NivelInsignia }> = [
  { level: "diamante", score: 0, name: "Diamante", emoji: "💎", faixaMinima: 98, description: "Regularidade extraordinária!" },
  { level: "ouro", score: 0, name: "Ouro", emoji: "🥇", faixaMinima: 90, description: "Excelente regularidade!" },
  { level: "prata", score: 0, name: "Prata", emoji: "🥈", faixaMinima: 75, description: "Uma jornada bem consistente." },
  { level: "bronze", score: 0, name: "Bronze", emoji: "🥉", faixaMinima: 0, description: "Cada jornada conta. Vamos em frente!" },
];

export function getRegularityBadge(score: number): InsigniaRegularidade {
  const pontuacao = Math.max(0, Math.min(100, Math.round(score)));
  const faixa = FAIXAS_INSIGNIAS.find((item) => pontuacao >= item.faixaMinima) ?? FAIXAS_INSIGNIAS.at(-1)!;
  return { ...faixa, score: pontuacao };
}

export interface DadosCalculoRetrospectiva {
  diasPrevistos: number;
  diasTrabalhados: number;
  diasPontuais: number;
  diasJornadaCumprida: number;
  diasComAjuste: number;
  minutosTrabalhados: number;
  minutosAtraso: number;
  regularidade: number;
  dias: ResumoJornadaDia[];
}

export function calcularRetrospectiva(periodo: string, registros: RegistroPonto[], jornada: Jornada | null, feriados: Set<string>): DadosCalculoRetrospectiva {
  const [dataInicio, dataFim] = limitesDoMes(periodo);
  const registrosPorDia = new Map<string, RegistroPonto[]>();
  for (const registro of registros) registrosPorDia.set(registro.data, [...(registrosPorDia.get(registro.data) ?? []), registro]);
  const dias: ResumoJornadaDia[] = [];
  const diasTrabalho = new Set(diasTrabalhoDaJornada(jornada));
  for (let data = dataInicio; data <= dataFim; data = adicionarDia(data)) {
    const objeto = new Date(`${data}T12:00:00`);
    if (diasTrabalho.has(objeto.getDay()) && !feriados.has(data)) dias.push(calcularResumoDia(data, registrosPorDia.get(data) ?? [], jornada));
  }
  const divisor = dias.length || 1;
  const diasTrabalhados = dias.filter((dia) => dia.entrada && dia.saida && (dia.minutosTrabalhados ?? 0) > 0).length;
  // Pontualidade e cumprimento de jornada só fazem sentido com uma jornada
  // configurada — sem ela, `minutosAtraso` nunca é calculado (ver
  // calcularResumoDia) e `cargaHorariaDiariaMinutos` não existe. Tratar a
  // ausência de jornada como "0 dias pontuais/cumpridos" evita inflar a nota
  // artificialmente para funcionários mal configurados.
  const diasPontuais = jornada ? dias.filter((dia) => !!dia.entrada && (dia.minutosAtraso ?? 0) === 0).length : 0;
  const diasJornadaCumprida = jornada ? dias.filter((dia) => (dia.minutosTrabalhados ?? 0) >= jornada.cargaHorariaDiariaMinutos).length : 0;
  const diasComAjuste = dias.filter((dia) => [dia.entrada, dia.saidaAlmoco, dia.retornoAlmoco, dia.saida].some((registro) => registro?.editadoPorCorrecao)).length;
  const minutosTrabalhados = dias.reduce((total, dia) => total + (dia.minutosTrabalhados ?? 0), 0);
  const minutosAtraso = dias.reduce((total, dia) => total + (dia.minutosAtraso ?? 0), 0);
  // Sem dias previstos no período (jornada sem dias de trabalho, ou mês
  // inteiro em feriados) não há base nenhuma para avaliar regularidade — 0
  // em vez de 100, para não premiar quem não teve nenhum dia a cumprir.
  const regularidade = dias.length === 0 ? 0 : Math.round(((diasPontuais / divisor) * REGULARIDADE_PESOS.pontualidade + (diasJornadaCumprida / divisor) * REGULARIDADE_PESOS.jornada + (dias.filter((dia) => !dia.incompleta).length / divisor) * REGULARIDADE_PESOS.ocorrencias) * 100);
  return { diasPrevistos: dias.length, diasTrabalhados, diasPontuais, diasJornadaCumprida, diasComAjuste, minutosTrabalhados, minutosAtraso, regularidade, dias };
}

function adicionarDia(data: string): string {
  const objeto = new Date(`${data}T12:00:00`);
  objeto.setDate(objeto.getDate() + 1);
  return formatarISO(objeto);
}

export function formatarISO(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}