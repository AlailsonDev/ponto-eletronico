import { addDoc, collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Setor } from "@/types/setor";

export async function listarSetoresAtivos(): Promise<Setor[]> {
  const q = query(collection(db, "setores"), where("ativo", "==", true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Setor, "id">) }));
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
export async function criarSetor(nome: string): Promise<void> {
  await addDoc(collection(db, "setores"), {
    nome,
    gestoresIds: [],
    ativo: true,
  });
}

export async function atualizarSetor(
  id: string,
  dados: { nome: string; ativo: boolean }
): Promise<void> {
  await updateDoc(doc(db, "setores", id), dados);
}
