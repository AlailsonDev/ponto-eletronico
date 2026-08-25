import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import type { EditarUsuarioInput, NovoUsuarioInput, Usuario } from "@/types/usuario";

/**
 * Chama a API Route /api/usuarios, anexando o ID Token do admin logado.
 * A rota, no servidor, revalida esse token e confere que quem está
 * chamando realmente é um admin ativo — o client nunca decide isso sozinho.
 */
export async function criarFuncionario(input: NovoUsuarioInput): Promise<{ uid: string }> {
  const user = auth.currentUser;
  if (!user) throw new Error("Sua sessão expirou. Faça login novamente.");

  const idToken = await user.getIdToken();

  const resposta = await fetch("/api/usuarios", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(input),
  });

  const dados = await resposta.json();
  if (!resposta.ok) {
    throw new Error(dados.erro ?? "Não foi possível criar o funcionário.");
  }
  return dados as { uid: string };
}

export async function listarFuncionarios(): Promise<Usuario[]> {
  const q = query(collection(db, "usuarios"), orderBy("nome"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<Usuario, "uid">) }));
}

export async function desativarFuncionario(uid: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Sua sessão expirou. Faça login novamente.");

  const resposta = await fetch(`/api/usuarios/${uid}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${await user.getIdToken()}` },
  });
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados.erro ?? "Não foi possível desativar o funcionário.");
}

export async function editarFuncionario(uid: string, input: EditarUsuarioInput): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Sua sessão expirou. Faça login novamente.");

  const resposta = await fetch(`/api/usuarios/${uid}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await user.getIdToken()}`,
    },
    body: JSON.stringify(input),
  });
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados.erro ?? "Não foi possível editar o funcionário.");
}
