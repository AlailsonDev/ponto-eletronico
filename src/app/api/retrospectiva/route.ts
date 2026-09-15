import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, verificarTokenAtivo } from "@/lib/firebase/admin";
import { construirRetrospectiva, periodoParaExibicaoHoje } from "@/services/retrospectiva.server";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
    if (!token) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
    const { uid, usuario } = await verificarTokenAtivo(token);
    const periodoSolicitado = request.nextUrl.searchParams.get("periodo");
    const periodoAutomatico = await periodoParaExibicaoHoje();
    const periodo = periodoSolicitado ?? periodoAutomatico;
    if (!periodo || !/^\d{4}-\d{2}$/.test(periodo)) return NextResponse.json({ retrospectiva: null, deveExibir: false });

    const referencia = adminDb.collection("retrospectivas").doc(`${uid}_${periodo}`);
    const existente = await referencia.get();
    // Enquanto o período estiver em exibição (a partir do dia
    // DIA_EXIBICAO_RETROSPECTIVA), o card volta a aparecer toda vez que o
    // funcionário abre o sistema — não só na primeira vez. `visualizadaEm`
    // continua sendo registrado (ver POST abaixo) só como histórico de
    // quando foi visto, sem suprimir a exibição automática.
    if (existente.exists) return NextResponse.json({ retrospectiva: { id: existente.id, ...existente.data() }, deveExibir: !periodoSolicitado });
    if (periodoSolicitado) return NextResponse.json({ retrospectiva: null, deveExibir: false });

    const retrospectiva = await construirRetrospectiva(uid, usuario, periodo);
    await adminDb.runTransaction(async (transaction) => {
      const atual = await transaction.get(referencia);
      if (atual.exists) return;
      transaction.set(referencia, { ...retrospectiva, usuarioId: uid, criadaEm: FieldValue.serverTimestamp() });
      transaction.update(adminDb.collection("usuarios").doc(uid), { insigniaAtual: retrospectiva.insignia, insigniaPeriodo: periodo });
    });
    return NextResponse.json({ retrospectiva: { id: referencia.id, ...retrospectiva, usuarioId: uid }, deveExibir: true });
  } catch (erro) {
    console.error("[GET /api/retrospectiva]", erro);
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
  } catch (erro) {
    console.error("[POST /api/retrospectiva]", erro);
    return NextResponse.json({ erro: "Não foi possível registrar a visualização." }, { status: 500 });
  }
}