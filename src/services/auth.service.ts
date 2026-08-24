import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  reload,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import type { Usuario } from "@/types/usuario";

// Mapeia códigos de erro técnicos do Firebase para mensagens amigáveis.
// Nunca mostramos "auth/invalid-credential" cru para o usuário final.
const MENSAGENS_ERRO: Record<string, string> = {
  "auth/invalid-credential": "Matrícula/e-mail ou senha incorretos.",
  "auth/invalid-email": "E-mail em formato inválido.",
  "auth/user-disabled": "Este usuário foi desativado. Fale com o RH.",
  "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  "auth/network-request-failed": "Falha de conexão. Verifique sua internet.",
};

export function traduzirErroFirebase(codigo: string): string {
  return MENSAGENS_ERRO[codigo] ?? "Não foi possível entrar. Tente novamente.";
}

export async function login(email: string, senha: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, senha);
  return credential.user;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export async function enviarEmailVerificacao(user: User): Promise<void> {
  await sendEmailVerification(user);
}

export async function atualizarUsuarioAutenticado(user: User): Promise<void> {
  await reload(user);
}

export async function solicitarRecuperacaoSenha(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Busca o documento de perfil (usuarios/{uid}) associado ao usuário autenticado.
 * Esse documento é a fonte de verdade para perfil, setor e status — nunca
 * confiamos em claims customizados sem checar o Firestore, para permitir
 * desativação imediata de um funcionário sem precisar revogar tokens.
 */
export async function buscarPerfilUsuario(uid: string): Promise<Usuario | null> {
  const snap = await getDoc(doc(db, "usuarios", uid));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...(snap.data() as Omit<Usuario, "uid">) };
}

export async function registrarUltimoAcesso(uid: string): Promise<void> {
  await updateDoc(doc(db, "usuarios", uid), {
    atualizadoEm: serverTimestamp(),
  });
}

export function observarSessao(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
