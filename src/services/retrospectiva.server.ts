import { adminDb } from "@/lib/firebase/admin";
import type { Jornada } from "@/types/jornada";
import type { RegistroPonto } from "@/types/registroPonto";
import { calcularRetrospectiva, getRegularityBadge, ultimoDiaUtilDoMes } from "@/lib/retrospectiva";
import { limitesDoMes } from "@/lib/formatadores";

export async function periodoDisponivelHoje(): Promise<string | null> {
  const agora = dataNoFusoLocal();
  const periodoAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
  const feriados = await listarFeriados(periodoAtual);
  const ultimoDia = ultimoDiaUtilDoMes(agora.getFullYear(), agora.getMonth() + 1, feriados);
  return formatarData(agora) === ultimoDia ? periodoAtual : null;
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
  const dados = calcularRetrospectiva(periodo, registros, jornada, feriados);
  return { periodo, dataInicio: inicio, dataFim: fim, ...dados, insignia: getRegularityBadge(dados.regularidade) };
}

async function listarFeriados(periodo: string): Promise<Set<string>> {
  const snapshot = await adminDb.collection("feriados").where("data", ">=", `${periodo}-01`).where("data", "<=", `${periodo}-31`).get();
  return new Set(snapshot.docs.map((documento) => String(documento.data().data)));
}

function dataNoFusoLocal(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Recife" }));
}

function formatarData(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}