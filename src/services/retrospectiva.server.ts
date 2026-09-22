import { adminDb } from "@/lib/firebase/admin";
import type { Jornada } from "@/types/jornada";
import type { RegistroPonto } from "@/types/registroPonto";
import { calcularRetrospectiva, formatarISO, getRegularityBadge, primeiroDiaUtilDoMes, PRIMEIRO_PERIODO_RETROSPECTIVA } from "@/lib/retrospectiva";
import { limitesDoMes } from "@/lib/formatadores";

/**
 * Período (mês civil) cuja retrospectiva está pendente hoje, ou null se
 * ainda não chegou a hora. Aponta sempre para o mês **anterior**, já
 * totalmente encerrado — assim o cálculo não depende de um dia em
 * andamento e o resultado é idêntico a qualquer hora do dia. Fica
 * disponível a partir do primeiro dia útil do mês corrente e permanece
 * pendente até o funcionário efetivamente vê-la (ver rota da API), de modo
 * que quem estava ausente no dia não perde a retrospectiva. Meses anteriores
 * a PRIMEIRO_PERIODO_RETROSPECTIVA (fase de testes) são ignorados.
 */
export async function periodoPendenteHoje(): Promise<string | null> {
  const agora = dataNoFusoLocal();
  const periodoAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
  const feriados = await listarFeriados(periodoAtual);
  const primeiroDiaUtil = primeiroDiaUtilDoMes(agora.getFullYear(), agora.getMonth() + 1, feriados);
  if (formatarISO(agora) < primeiroDiaUtil) return null;
  const mesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
  const periodo = `${mesAnterior.getFullYear()}-${String(mesAnterior.getMonth() + 1).padStart(2, "0")}`;
  return periodo < PRIMEIRO_PERIODO_RETROSPECTIVA ? null : periodo;
}

/** Data ("YYYY-MM-DD") no fuso de operação. Sem argumento, hoje. */
export function dataLocalISO(base?: Date): string {
  return formatarISO(dataNoFusoLocal(base));
}

/**
 * false quando o funcionário foi admitido depois do fim do período — não
 * há jornada nenhuma para retrospectivar, e mostrar "0 dias / Bronze / 0%"
 * para quem acabou de entrar seria enganoso.
 */
export function admitidoNoPeriodo(usuario: FirebaseFirestore.DocumentData | undefined, periodo: string): boolean {
  const admissao = usuario?.dataAdmissao;
  if (typeof admissao?.toDate !== "function") return true;
  const [, fimPeriodo] = limitesDoMes(periodo);
  return dataLocalISO(admissao.toDate()) <= fimPeriodo;
}

export async function construirRetrospectiva(uid: string, usuario: FirebaseFirestore.DocumentData | undefined, periodo: string) {
  const jornadaId = usuario?.jornadaId;
  const jornadaSnapshot = jornadaId ? await adminDb.collection("jornadas").doc(String(jornadaId)).get() : null;
  const jornada = jornadaSnapshot?.exists ? ({ id: jornadaSnapshot.id, ...jornadaSnapshot.data() } as Jornada) : null;
  const feriados = await listarFeriados(periodo);
  const [inicio, fim] = limitesDoMes(periodo);
  const snapshot = await adminDb.collection("registros_ponto").where("usuarioId", "==", uid).get();
  const registros = snapshot.docs
    .map((documento) => ({ id: documento.id, ...documento.data() } as unknown as RegistroPonto))
    .filter((registro) => registro.data >= inicio && registro.data <= fim);
  const diasNeutros = new Set<string>([
    // Registro retroativo: ponto nunca batido ao vivo, sem validação de
    // geolocalização — não conta a favor nem contra. Confirmado com dados
    // reais: um funcionário com vários registros retroativos cravados no
    // exato horário de início da jornada (padrão impossível numa batida ao
    // vivo) chegaria a Ouro/Diamante sem nenhuma verificação por trás.
    ...registros.filter((registro) => registro.registroRetroativo).map((registro) => registro.data),
    ...(await diasComAusenciaAprovada(uid, inicio, fim)),
  ]);
  // `dias` é o detalhamento diário usado só para calcular os agregados
  // abaixo — não faz parte do tipo Retrospectiva e não pode ser persistido
  // como está: cada dia sem registro tem `entrada`/`saida` undefined, e o
  // Firestore rejeita `undefined` em escritas (quebraria a transação).
  const { dias: _dias, ...dados } = calcularRetrospectiva(periodo, registros, jornada, feriados, diasNeutros);
  return { periodo, dataInicio: inicio, dataFim: fim, ...dados, insignia: getRegularityBadge(dados.regularidade) };
}

async function listarFeriados(periodo: string): Promise<Set<string>> {
  const snapshot = await adminDb.collection("feriados").where("data", ">=", `${periodo}-01`).where("data", "<=", `${periodo}-31`).get();
  return new Set(snapshot.docs.map((documento) => String(documento.data().data)));
}

/**
 * Datas com justificativa de ausência aprovada dentro do período. Filtra em
 * memória por usuarioId (já indexado por padrão) para não depender de um
 * índice composto no Firestore, igual às outras consultas deste arquivo.
 */
async function diasComAusenciaAprovada(uid: string, inicio: string, fim: string): Promise<string[]> {
  const snapshot = await adminDb.collection("solicitacoes_correcao").where("usuarioId", "==", uid).get();
  return snapshot.docs
    .map((documento) => documento.data())
    .filter((dados) => dados.status === "aprovada" && !!dados.categoria && dados.data >= inicio && dados.data <= fim)
    .map((dados) => dados.data as string);
}

function dataNoFusoLocal(base: Date = new Date()): Date {
  return new Date(base.toLocaleString("en-US", { timeZone: "America/Recife" }));
}