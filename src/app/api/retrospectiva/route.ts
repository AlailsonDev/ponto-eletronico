import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, verificarTokenAtivo } from "@/lib/firebase/admin";
import { construirRetrospectiva, periodoDisponivelHoje } from "@/services/retrospectiva.server";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
    if (!token) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
    const { uid, usuario } = await verificarTokenAtivo(token);
    const periodoSolicitado = request.nextUrl.searchParams.get("periodo");
    const periodoAutomatico = await periodoDisponivelHoje();
    const periodo = periodoSolicitado ?? periodoAutomatico;
    if (!periodo || !/^\d{4}-\d{2}$/.test(periodo)) return NextResponse.json({ retrospectiva: null, deveExibir: false });

    const referencia = adminDb.collection("retrospectivas").doc(`${uid}_${periodo}`);
    const existente = await referencia.get();
    if (existente.exists) return NextResponse.json({ retrospectiva: { id: existente.id, ...existente.data() }, deveExibir: !existente.data()?.visualizadaEm && !periodoSolicitado });
    if (periodoSolicitado) return NextResponse.json({ retrospectiva: null, deveExibir: false });

    const retrospectiva = await construirRetrospectiva(uid, usuario, periodo);
    await adminDb.runTransaction(async (transaction) => {
      const atual = await transaction.get(referencia);
      if (atual.exists) return;
      transaction.set(referencia, { ...retrospectiva, usuarioId: uid, criadaEm: FieldValue.serverTimestamp() });
      transaction.update(adminDb.collection("usuarios").doc(uid), { insigniaAtual: retrospectiva.insignia, insigniaPeriodo: periodo });
    });
    return NextResponse.json({ retrospectiva: { id: referencia.id, ...retrospectiva }, deveExibir: true });
  } catch {
    return NextResponse.json({ erro: "Não foi possível carregar sua retrospectiva." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
    if (!token) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
    const { uid } = await verificarTokenAtivo(token);
    const body = (await request.json()) as { periodo?: string };
    if (!body.periodo || !/^\d{4}-\d{2}$/.test(body.periodo)) return NextResponse.json({ erro: "Período inválido." }, { status: 400 });
    await adminDb.collection("retrospectivas").doc(`${uid}_${body.periodo}`).update({ visualizadaEm: FieldValue.serverTimestamp() });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ erro: "Não foi possível registrar a visualização." }, { status: 500 });
  }
}