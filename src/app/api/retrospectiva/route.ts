import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, verificarTokenAtivo } from "@/lib/firebase/admin";
import { admitidoNoPeriodo, construirRetrospectiva, dataLocalISO, periodoPendenteHoje } from "@/services/retrospectiva.server";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
    if (!token) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
    const { uid, usuario } = await verificarTokenAtivo(token);
    const periodoSolicitado = request.nextUrl.searchParams.get("periodo");

    // Consulta explícita a um período específico (ex.: navegação futura por
    // meses passados): nunca gera um novo cálculo nem abre o modal sozinho.
    if (periodoSolicitado) {
      if (!/^\d{4}-\d{2}$/.test(periodoSolicitado)) return NextResponse.json({ retrospectiva: null, deveExibir: false });
      const doc = await adminDb.collection("retrospectivas").doc(`${uid}_${periodoSolicitado}`).get();
      return NextResponse.json({ retrospectiva: doc.exists ? { id: doc.id, ...doc.data() } : null, deveExibir: false });
    }

    const periodoPendente = await periodoPendenteHoje();
    if (periodoPendente && admitidoNoPeriodo(usuario, periodoPendente)) {
      const referencia = adminDb.collection("retrospectivas").doc(`${uid}_${periodoPendente}`);
      const existente = await referencia.get();
      const visualizadaEm = existente.data()?.visualizadaEm;
      // A retrospectiva continua "em exibição" até o funcionário fechá-la em
      // algum dia anterior. Assim: quem estava ausente no primeiro dia útil
      // vê no primeiro acesso que fizer; quem já viu hoje continua vendo se
      // recarregar a página; e a partir do dia seguinte ela não abre mais
      // sozinha.
      const emExibicao = !visualizadaEm || dataLocalISO(visualizadaEm.toDate()) === dataLocalISO();
      if (emExibicao) {
        // Recalcula enquanto está em exibição — o mês já fechou, mas uma
        // correção de ponto aprovada nesse meio-tempo ainda muda os números.
        const retrospectiva = await construirRetrospectiva(uid, usuario, periodoPendente);
        await adminDb.runTransaction(async (transaction) => {
          transaction.set(referencia, {
            ...retrospectiva,
            usuarioId: uid,
            criadaEm: FieldValue.serverTimestamp(),
            // Preserva a marca de visualização: é ela que encerra a exibição
            // automática a partir do dia seguinte.
            ...(visualizadaEm ? { visualizadaEm } : {}),
          });
          transaction.update(adminDb.collection("usuarios").doc(uid), { insigniaAtual: retrospectiva.insignia, insigniaPeriodo: periodoPendente });
        });
        return NextResponse.json({ retrospectiva: { id: referencia.id, ...retrospectiva, usuarioId: uid, ...(visualizadaEm ? { visualizadaEm } : {}) }, deveExibir: true });
      }
      return NextResponse.json({ retrospectiva: { id: existente.id, ...existente.data() }, deveExibir: false });
    }

    // Fora do dia de exibição: ainda devolve a última retrospectiva já
    // gerada (via usuario.insigniaPeriodo) para a insígnia continuar visível
    // na saudação/cabeçalho e o botão "Minha retrospectiva" continuar
    // funcionando — só sem abrir o modal sozinho.
    const ultimoPeriodo = usuario?.insigniaPeriodo;
    if (!ultimoPeriodo) return NextResponse.json({ retrospectiva: null, deveExibir: false });
    const ultima = await adminDb.collection("retrospectivas").doc(`${uid}_${ultimoPeriodo}`).get();
    return NextResponse.json({ retrospectiva: ultima.exists ? { id: ultima.id, ...ultima.data() } : null, deveExibir: false });
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