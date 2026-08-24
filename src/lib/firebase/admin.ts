import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// ATENÇÃO: este arquivo só pode ser importado dentro de código que roda no
// servidor (API Routes, ex: src/app/api/**/route.ts). Se for importado em um
// componente client, o build vai falhar (ou pior, vazar credenciais) —
// isso é intencional, é a rede de segurança contra uso indevido.
if (typeof window !== "undefined") {
  throw new Error(
    "firebase/admin não pode ser importado no client. Use apenas em API Routes."
  );
}

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

const adminApp = getAdminApp();
export const adminAuth: Auth = getAuth(adminApp);
export const adminDb: Firestore = getFirestore(adminApp);

/**
 * Verifica o ID Token enviado pelo client e retorna os claims do usuário.
 * Toda API Route sensível (criação de usuário, aprovação de correção) deve
 * chamar isso antes de executar qualquer ação administrativa — nunca confie
 * apenas no fato de a rota existir.
 */
export async function verificarTokenAdmin(idToken: string) {
  const decoded = await adminAuth.verifyIdToken(idToken);

  const usuarioDoc = await adminDb.collection("usuarios").doc(decoded.uid).get();
  if (!usuarioDoc.exists) {
    throw new Error("Usuário não encontrado.");
  }

  const usuario = usuarioDoc.data();
  if (usuario?.status !== "ativo") {
    throw new Error("Usuário inativo.");
  }
  if (usuario?.perfil !== "admin") {
    throw new Error("Ação restrita a administradores.");
  }

  return { uid: decoded.uid, usuario };
}

export async function verificarTokenAtivo(idToken: string) {
  const decoded = await adminAuth.verifyIdToken(idToken);
  const usuarioDoc = await adminDb.collection("usuarios").doc(decoded.uid).get();
  if (!usuarioDoc.exists || usuarioDoc.data()?.status !== "ativo") {
    throw new Error("Usuário inativo ou não encontrado.");
  }
  return { uid: decoded.uid, usuario: usuarioDoc.data() };
}
