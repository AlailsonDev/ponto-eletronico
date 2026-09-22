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

/**
 * `diasNeutros`: datas ("YYYY-MM-DD") que não entram na NOTA de
 * regularidade — nem a favor, nem contra. São dias com ausência justificada
 * aprovada ou com registro retroativo aprovado (ponto nunca batido ao vivo,
 * sem validação de geolocalização): contá-los como falha seria injusto com
 * quem teve um motivo legítimo, mas contá-los como um dia perfeito
 * recompensaria um registro que ninguém verificou de fato.
 *
 * Importante: isso afeta só a NOTA (diasPontuais, diasJornadaCumprida,
 * regularidade, diasPrevistos) — os totais informativos (diasTrabalhados,
 * minutosTrabalhados, minutosAtraso, diasComAjuste) continuam somando TODOS
 * os dias reais do período, neutros inclusive. A pessoa realmente trabalhou
 * aquelas horas depois de corrigidas/aprovadas; escondê-las da retrospectiva
 * faria o total divergir do relatório administrativo (que não aplica esse
 * filtro) sem nenhum ganho — só a nota de regularidade precisa da exclusão.
 */
export function calcularRetrospectiva(periodo: string, registros: RegistroPonto[], jornada: Jornada | null, feriados: Set<string>, diasNeutros: Set<string> = new Set()): DadosCalculoRetrospectiva {
  const [dataInicio, dataFim] = limitesDoMes(periodo);
  const registrosPorDia = new Map<string, RegistroPonto[]>();
  for (const registro of registros) registrosPorDia.set(registro.data, [...(registrosPorDia.get(registro.data) ?? []), registro]);
  const dias: ResumoJornadaDia[] = [];
  const diasTrabalho = new Set(diasTrabalhoDaJornada(jornada));
  for (let data = dataInicio; data <= dataFim; data = adicionarDia(data)) {
    const objeto = new Date(`${data}T12:00:00`);
    if (diasTrabalho.has(objeto.getDay()) && !feriados.has(data)) {
      dias.push(calcularResumoDia(data, registrosPorDia.get(data) ?? [], jornada));
    }
  }
  // Subconjunto usado só para a nota de regularidade — o resto dos totais
  // abaixo usa `dias` (todos os dias reais do período).
  const diasAvaliados = dias.filter((dia) => !diasNeutros.has(dia.data));
  const divisorAvaliado = diasAvaliados.length || 1;

  const diasTrabalhados = dias.filter((dia) => dia.entrada && dia.saida && (dia.minutosTrabalhados ?? 0) > 0).length;
  // Pontualidade e cumprimento de jornada só fazem sentido com uma jornada
  // configurada — sem ela, `minutosAtraso` nunca é calculado (ver
  // calcularResumoDia) e `cargaHorariaDiariaMinutos` não existe. Tratar a
  // ausência de jornada como "0 dias pontuais/cumpridos" evita inflar a nota
  // artificialmente para funcionários mal configurados.
  const diasPontuais = jornada ? diasAvaliados.filter((dia) => !!dia.entrada && (dia.minutosAtraso ?? 0) === 0).length : 0;
  const diasJornadaCumprida = jornada ? diasAvaliados.filter((dia) => (dia.minutosTrabalhados ?? 0) >= jornada.cargaHorariaDiariaMinutos).length : 0;
  const diasComAjuste = dias.filter((dia) => [dia.entrada, dia.saidaAlmoco, dia.retornoAlmoco, dia.saida].some((registro) => registro?.editadoPorCorrecao)).length;
  const minutosTrabalhados = dias.reduce((total, dia) => total + (dia.minutosTrabalhados ?? 0), 0);
  const minutosAtraso = dias.reduce((total, dia) => total + (dia.minutosAtraso ?? 0), 0);
  // Sem dias avaliados no período (jornada sem dias de trabalho, mês inteiro
  // em feriados, ou tudo neutro) não há base nenhuma para avaliar
  // regularidade — 0 em vez de 100, para não premiar quem não teve nenhum
  // dia a cumprir.
  const regularidade = diasAvaliados.length === 0 ? 0 : Math.round(((diasPontuais / divisorAvaliado) * REGULARIDADE_PESOS.pontualidade + (diasJornadaCumprida / divisorAvaliado) * REGULARIDADE_PESOS.jornada + (diasAvaliados.filter((dia) => !dia.incompleta).length / divisorAvaliado) * REGULARIDADE_PESOS.ocorrencias) * 100);
  return { diasPrevistos: diasAvaliados.length, diasTrabalhados, diasPontuais, diasJornadaCumprida, diasComAjuste, minutosTrabalhados, minutosAtraso, regularidade, dias };
}

function adicionarDia(data: string): string {
  const objeto = new Date(`${data}T12:00:00`);
  objeto.setDate(objeto.getDate() + 1);
  return formatarISO(objeto);
}

export function formatarISO(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}