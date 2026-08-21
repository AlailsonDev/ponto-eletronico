import type { Jornada } from "@/types/jornada";
import type { RegistroPonto } from "@/types/registroPonto";
import { horarioParaMinutos, timestampParaMinutosDoDia } from "@/lib/formatadores";

export type StatusFuncionarioHoje =
  | "trabalhando"
  | "em_almoco"
  | "concluido"
  | "atrasado"
  | "ausente";

const RÓTULOS: Record<StatusFuncionarioHoje, string> = {
  trabalhando: "Trabalhando",
  em_almoco: "Em almoço",
  concluido: "Concluído",
  atrasado: "Atrasado",
  ausente: "Ausente",
};

export function rotuloStatus(status: StatusFuncionarioHoje): string {
  return RÓTULOS[status];
}

/**
 * Deriva o status atual de um funcionário a partir dos registros de hoje.
 * "ausente" vs "atrasado" depende do horário atual comparado à jornada:
 * antes do horário previsto de entrada (+ tolerância) é só "ausente"
 * (ainda dentro do esperado); depois disso, vira "atrasado".
 */
export function calcularStatusFuncionario(
  registrosDoFuncionarioHoje: RegistroPonto[],
  jornada: Jornada | null,
  agora: Date
): StatusFuncionarioHoje {
  const tem = (tipo: RegistroPonto["tipo"]) =>
    registrosDoFuncionarioHoje.some((r) => r.tipo === tipo);

  if (tem("SAIDA")) return "concluido";
  if (tem("RETORNO_ALMOCO")) return "trabalhando";
  if (tem("SAIDA_ALMOCO")) return "em_almoco";
  if (tem("ENTRADA")) return "trabalhando";

  // Ainda não bateu ENTRADA hoje — só é "atrasado" se já passou do horário
  // previsto + tolerância. Sem jornada configurada, não dá pra saber, então
  // assume "ausente" (evita marcar todo mundo como atrasado por falta de dado).
  if (!jornada) return "ausente";

  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
  const entradaPrevista = horarioParaMinutos(jornada.entrada) + jornada.toleranciaMinutos;

  return minutosAgora > entradaPrevista ? "atrasado" : "ausente";
}

export interface ContadoresDashboard {
  totalAtivos: number;
  trabalhando: number;
  emAlmoco: number;
  concluidos: number;
  atrasados: number;
  ausentes: number; // inclui atrasados, ver comentário abaixo
}

/**
 * "ausentes" aqui representa TODO mundo que ainda não bateu ENTRADA hoje —
 * "atrasados" é o subconjunto desse grupo cujo horário já passou. Optamos
 * por manter ambos os números (em vez de mutuamente exclusivos) porque é
 * assim que a especificação original do dashboard descreve os cards.
 */
export function calcularContadores(
  statusPorFuncionario: StatusFuncionarioHoje[]
): ContadoresDashboard {
  const contadores: ContadoresDashboard = {
    totalAtivos: statusPorFuncionario.length,
    trabalhando: 0,
    emAlmoco: 0,
    concluidos: 0,
    atrasados: 0,
    ausentes: 0,
  };

  for (const status of statusPorFuncionario) {
    if (status === "trabalhando") contadores.trabalhando++;
    if (status === "em_almoco") contadores.emAlmoco++;
    if (status === "concluido") contadores.concluidos++;
    if (status === "atrasado") {
      contadores.atrasados++;
      contadores.ausentes++;
    }
    if (status === "ausente") contadores.ausentes++;
  }

  return contadores;
}

/** Timestamp do último registro de um funcionário hoje (para ordenar "quem chegou por último" etc). */
export function timestampMaisRecente(registros: RegistroPonto[]): number {
  const minutos = registros
    .map((registro) => timestampParaMinutosDoDia(registro.dataHora))
    .filter((valor): valor is number => valor !== undefined);
  if (minutos.length === 0) return -1;
  return Math.max(...minutos);
}
