import { adminDb } from "@/lib/firebase/admin";
import type { Jornada } from "@/types/jornada";
import type { RegistroPonto } from "@/types/registroPonto";
import { calcularRetrospectiva, DIA_EXIBICAO_RETROSPECTIVA, getRegularityBadge } from "@/lib/retrospectiva";
import { limitesDoMes } from "@/lib/formatadores";

/**
 * Período (mês civil) cuja retrospectiva deve ser exibida hoje, ou null se
 * ainda não é hora. Sempre aponta para o mês anterior ao atual — já
 * totalmente encerrado, então o cálculo nunca pega um dia pela metade —, e
 * só passa a valer a partir do dia DIA_EXIBICAO_RETROSPECTIVA do mês
 * corrente (ex.: retrospectiva de agosto liberada a partir de 15/09).
 */
export async function periodoParaExibicaoHoje(): Promise<string | null> {
  const agora = dataNoFusoLocal();
  if (agora.getDate() < DIA_EXIBICAO_RETROSPECTIVA) return null;
  const mesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
  return `${mesAnterior.getFullYear()}-${String(mesAnterior.getMonth() + 1).padStart(2, "0")}`;
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
  // `dias` é o detalhamento diário usado só para calcular os agregados
  // abaixo — não faz parte do tipo Retrospectiva e não pode ser persistido
  // como está: cada dia sem registro tem `entrada`/`saida` undefined, e o
  // Firestore rejeita `undefined` em escritas (quebraria a transação).
  const { dias: _dias, ...dados } = calcularRetrospectiva(periodo, registros, jornada, feriados);
  return { periodo, dataInicio: inicio, dataFim: fim, ...dados, insignia: getRegularityBadge(dados.regularidade) };
}

async function listarFeriados(periodo: string): Promise<Set<string>> {
  const snapshot = await adminDb.collection("feriados").where("data", ">=", `${periodo}-01`).where("data", "<=", `${periodo}-31`).get();
  return new Set(snapshot.docs.map((documento) => String(documento.data().data)));
}

function dataNoFusoLocal(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Recife" }));
}