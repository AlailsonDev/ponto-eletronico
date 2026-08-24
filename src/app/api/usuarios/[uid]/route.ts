import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb, verificarTokenAdmin } from "@/lib/firebase/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  let authDesabilitado = false;

  try {
    const authHeader = request.headers.get("authorization");
    const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!idToken) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

    const administrador = await verificarTokenAdmin(idToken);
    if (!params.uid || params.uid === administrador.uid) {
      return NextResponse.json({ erro: "Não é possível desativar a própria conta." }, { status: 400 });
    }

    const usuarioRef = adminDb.collection("usuarios").doc(params.uid);
    const usuarioSnapshot = await usuarioRef.get();
    if (!usuarioSnapshot.exists) {
      return NextResponse.json({ erro: "Funcionário não encontrado." }, { status: 404 });
    }
    const usuario = usuarioSnapshot.data()!;
    if (usuario.status === "inativo") {
      return NextResponse.json({ erro: "Este funcionário já está inativo." }, { status: 409 });
    }

    await adminAuth.getUser(params.uid);
    await adminAuth.updateUser(params.uid, { disabled: true });
    authDesabilitado = true;

    try {
      await adminDb.runTransaction(async (transaction) => {
        const atual = await transaction.get(usuarioRef);
        if (!atual.exists || atual.data()?.status !== "ativo") throw new Error("USUARIO_JA_INATIVO");

        const auditoriaRef = adminDb.collection("auditoria").doc();
        transaction.update(usuarioRef, { status: "inativo", atualizadoEm: FieldValue.serverTimestamp() });
        transaction.set(auditoriaRef, {
          acao: "desativacao_usuario",
          administradorId: administrador.uid,
          alvoId: params.uid,
          detalhes: { nome: usuario.nome, matricula: usuario.matricula },
          criadoEm: FieldValue.serverTimestamp(),
        });
      });
    } catch (erroFirestore) {
      await adminAuth.updateUser(params.uid, { disabled: false }).catch(() => {});
      authDesabilitado = false;
      throw erroFirestore;
    }

    return NextResponse.json({ uid: params.uid, status: "inativo" });
  } catch (erro) {
    if (authDesabilitado) await adminAuth.updateUser(params.uid, { disabled: false }).catch(() => {});
    const mensagem = (erro as Error).message ?? "";
    if (mensagem === "USUARIO_JA_INATIVO") {
      return NextResponse.json({ erro: "Este funcionário já está inativo." }, { status: 409 });
    }
    if (mensagem.includes("restrita") || mensagem.includes("não verificado")) {
      return NextResponse.json({ erro: "Acesso negado." }, { status: 403 });
    }
    if (mensagem.includes("não encontrado")) {
      return NextResponse.json({ erro: "Funcionário não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ erro: "Não foi possível desativar o funcionário." }, { status: 500 });
  }
}