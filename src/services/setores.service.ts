import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { coordenadasValidas } from "@/lib/geolocalizacao";
import { db } from "@/lib/firebase/config";
import type { Setor } from "@/types/setor";

export async function listarSetoresAtivos(): Promise<Setor[]> {
  const q = query(collection(db, "setores"), where("ativo", "==", true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Setor, "id">) }));
}

export async function buscarSetor(id: string): Promise<Setor | null> {
  const snapshot = await getDoc(doc(db, "setores", id));
  return snapshot.exists() ? ({ id: snapshot.id, ...(snapshot.data() as Omit<Setor, "id">) }) : null;
}

/** Todos os setores, ativos e inativos — usada na tela de gerenciamento do admin. */
export async function listarTodosSetores(): Promise<Setor[]> {
  const snapshot = await getDocs(collection(db, "setores"));
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Setor, "id">) }));
}

/**
 * Escrita direta do client (não precisa de API Route/Admin SDK, diferente
 * do cadastro de funcionário): setores não envolvem o Firebase Auth, então
 * a Security Rule (souAdmin()) já é proteção suficiente por si só.
 */
export async function criarSetor(dados: ConfiguracaoLocalSetor): Promise<void> {
  if (!coordenadasValidas(dados) || dados.raioMetros <= 0 || dados.raioMetros > 1_000) throw new Error("CONFIGURACAO_LOCAL_INVALIDA");
  await addDoc(collection(db, "setores"), {
    ...dados,
    gestoresIds: [],
  });
}

export interface ConfiguracaoLocalSetor {
  nome: string;
  ativo: boolean;
  latitude: number;
  longitude: number;
  raioMetros: number;
}

export async function atualizarSetor(
  id: string,
  dados: Partial<ConfiguracaoLocalSetor>
): Promise<void> {
  if (dados.latitude !== undefined || dados.longitude !== undefined || dados.raioMetros !== undefined) {
    if (!coordenadasValidas({ latitude: dados.latitude ?? NaN, longitude: dados.longitude ?? NaN }) || !dados.raioMetros || dados.raioMetros <= 0 || dados.raioMetros > 1_000) throw new Error("CONFIGURACAO_LOCAL_INVALIDA");
  }
  await updateDoc(doc(db, "setores", id), { ...dados });
}
