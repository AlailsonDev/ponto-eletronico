import { addDoc, collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Jornada } from "@/types/jornada";

export async function buscarJornada(jornadaId: string): Promise<Jornada | null> {
  const snap = await getDoc(doc(db, "jornadas", jornadaId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Jornada, "id">) };
}

export async function listarJornadas(): Promise<Jornada[]> {
  const snapshot = await getDocs(collection(db, "jornadas"));
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Jornada, "id">) }));
}

export type DadosJornada = Omit<Jornada, "id">;

export async function criarJornada(dados: DadosJornada): Promise<void> {
  await addDoc(collection(db, "jornadas"), dados);
}

export async function atualizarJornada(id: string, dados: DadosJornada): Promise<void> {
  await updateDoc(doc(db, "jornadas", id), dados);
}
