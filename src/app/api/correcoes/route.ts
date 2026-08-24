import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb, verificarTokenAdmin, verificarTokenAtivo } from "@/lib/firebase/admin";
import type { StatusSolicitacaoCorrecao } from "@/types/registroPonto";

interface CorrecaoInput {
  acao?: "criar";
  solicitacaoId?: string;
  decisao?: StatusSolicitacaoCorrecao;
  resposta?: string;
  registroId?: string;
  novoHorario?: string;
  motivo?: string;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!idToken) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

    await verificarTokenAdmin(idToken);
    const snapshot = await adminDb
      .collection("solicitacoes_correcao")
      .where("status", "==", "pendente")
      .get();
    const solicitacoes = snapshot.docs
      .sort((a, b) => {
        const primeiro = a.data().criadoEm?.toMillis?.() ?? 0;
        const segundo = b.data().criadoEm?.toMillis?.() ?? 0;
        return primeiro - segundo;
      })
      .map((documento) => ({ id: documento.id, ...documento.data() }));
    return NextResponse.json(solicitacoes);
  } catch (erro) {
    const mensagem = (erro as Error).message ?? "";
    if (mensagem.includes("restrita") || mensagem.includes("inativo") || mensagem.includes("não encontrado")) {
      return NextResponse.json({ erro: "Acesso negado." }, { status: 403 });
    }
    return NextResponse.json({ erro: "Não foi possível carregar as solicitações." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!idToken) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

    const body = (await request.json()) as CorrecaoInput;
    if (body.acao === "criar") {
      const { uid } = await verificarTokenAtivo(idToken);
      if (!body.registroId || !body.novoHorario || !body.motivo || body.motivo.trim().length < 5) {
        return NextResponse.json({ erro: "Dados da solicitação inválidos." }, { status: 400 });
      }
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(body.novoHorario)) {
        return NextResponse.json({ erro: "Horário inválido." }, { status: 400 });
      }
      const registroSnapshot = await adminDb.collection("registros_ponto").doc(body.registroId).get();
      const registro = registroSnapshot.data();
      if (!registroSnapshot.exists || registro?.usuarioId !== uid) {
        return NextResponse.json({ erro: "Registro inválido." }, { status: 400 });
      }
      const solicitacao = await adminDb.collection("solicitacoes_correcao").add({
        registroId: body.registroId,
        usuarioId: uid,
        setorId: registro.setorId,
        data: registro.data,
        tipo: registro.tipo,
        novoHorario: body.novoHorario,
        motivo: body.motivo.trim(),
        status: "pendente",
        criadoEm: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ id: solicitacao.id }, { status: 201 });
    }

    const { uid } = await verificarTokenAdmin(idToken);
    if (!body.solicitacaoId || !["aprovada", "rejeitada"].includes(body.decisao ?? "")) {
      return NextResponse.json({ erro: "Solicitação ou decisão inválida." }, { status: 400 });
    }

    const solicitacaoRef = adminDb.collection("solicitacoes_correcao").doc(body.solicitacaoId);
    await adminDb.runTransaction(async (transaction) => {
      const solicitacaoSnapshot = await transaction.get(solicitacaoRef);
      if (!solicitacaoSnapshot.exists) throw new Error("SOLICITACAO_NAO_ENCONTRADA");
      const solicitacao = solicitacaoSnapshot.data()!;
      if (solicitacao.status !== "pendente") throw new Error("SOLICITACAO_JA_PROCESSADA");

      const agora = Timestamp.now();
      if (body.decisao === "aprovada") {
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(solicitacao.novoHorario)) {
          throw new Error("HORARIO_INVALIDO");
        }
        const registroRef = adminDb.collection("registros_ponto").doc(solicitacao.registroId);
        const registroSnapshot = await transaction.get(registroRef);
        if (!registroSnapshot.exists) throw new Error("REGISTRO_NAO_ENCONTRADO");
        const registro = registroSnapshot.data()!;
        if (
          registro.usuarioId !== solicitacao.usuarioId ||
          registro.data !== solicitacao.data ||
          registro.tipo !== solicitacao.tipo ||
          registro.setorId !== solicitacao.setorId
        ) {
          throw new Error("REGISTRO_INVALIDO");
        }

        // Horários do sistema são locais de Jaboatão (UTC-03:00).
        const dataHora = Timestamp.fromDate(
          new Date(`${solicitacao.data}T${solicitacao.novoHorario}:00-03:00`)
        );
        transaction.update(registroRef, {
          dataHora,
          editadoPorCorrecao: true,
          observacao: `Correção aprovada: ${solicitacao.motivo}`,
        });
      }

      transaction.update(solicitacaoRef, {
        status: body.decisao,
        resposta: body.resposta?.trim() || null,
        processadoEm: agora,
        processadoPor: uid,
      });
      const auditoriaRef = adminDb.collection("auditoria").doc();
      transaction.set(auditoriaRef, {
        acao: "correcao_ponto",
        administradorId: uid,
        alvoId: solicitacao.registroId,
        detalhes: {
          solicitacaoId: body.solicitacaoId,
          decisao: body.decisao,
          usuarioId: solicitacao.usuarioId,
          novoHorario: solicitacao.novoHorario,
        },
        criadoEm: agora,
      });
    });

    return NextResponse.json({ ok: true });
  } catch (erro) {
    const codigo = (erro as Error).message;
    if (codigo === "SOLICITACAO_NAO_ENCONTRADA") {
      return NextResponse.json({ erro: "Solicitação não encontrada." }, { status: 404 });
    }
    if (codigo === "SOLICITACAO_JA_PROCESSADA") {
      return NextResponse.json({ erro: "Esta solicitação já foi processada." }, { status: 409 });
    }
    if (codigo === "REGISTRO_NAO_ENCONTRADO" || codigo === "REGISTRO_INVALIDO" || codigo === "HORARIO_INVALIDO") {
      return NextResponse.json({ erro: "Dados da correção inválidos." }, { status: 400 });
    }
    const mensagem = (erro as Error).message ?? "";
    if (mensagem.includes("restrita") || mensagem.includes("inativo") || mensagem.includes("não encontrado")) {
      return NextResponse.json({ erro: "Acesso negado." }, { status: 403 });
    }
    return NextResponse.json({ erro: "Não foi possível processar a correção." }, { status: 500 });
  }
}