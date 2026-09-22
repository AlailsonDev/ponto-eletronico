import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb, verificarTokenAtivo, verificarTokenGestorOuAdmin } from "@/lib/firebase/admin";
import { idRegistroPonto } from "@/lib/validacaoSequencia";
import type { StatusSolicitacaoCorrecao, TipoRegistro } from "@/types/registroPonto";

const TIPOS: TipoRegistro[] = ["ENTRADA", "SAIDA_ALMOCO", "RETORNO_ALMOCO", "SAIDA"];

function dataLocalHoje(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Recife" }).format(new Date());
}

/**
 * Toca o documento-sinal que o cabeçalho escuta em tempo real (ver
 * firestore.rules) para saber quando reconsultar a contagem de solicitações
 * pendentes — chamado toda vez que uma solicitação é criada ou decidida.
 */
async function avisarMudancaDeSolicitacoes(): Promise<void> {
  await adminDb.collection("contadores").doc("correcoes").set(
    { atualizadoEm: FieldValue.serverTimestamp() },
    { merge: true }
  );
}

interface CorrecaoInput {
  acao?: "criar";
  solicitacaoId?: string;
  decisao?: StatusSolicitacaoCorrecao;
  resposta?: string;
  registroId?: string;
  // Presentes só quando é uma solicitação de registro retroativo (ponto
  // esquecido, sem registroId) — identificam qual dia/marco está faltando.
  data?: string;
  tipo?: TipoRegistro;
  novoHorario?: string;
  motivo?: string;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!idToken) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

    const { usuario } = await verificarTokenGestorOuAdmin(idToken);
    const snapshot = await adminDb
      .collection("solicitacoes_correcao")
      .where("status", "==", "pendente")
      .get();
    const solicitacoes = await Promise.all(snapshot.docs
      .sort((a, b) => {
        const primeiro = a.data().criadoEm?.toMillis?.() ?? 0;
        const segundo = b.data().criadoEm?.toMillis?.() ?? 0;
        return primeiro - segundo;
      })
      .map(async (documento) => {
        const dados = documento.data();
        const solicitanteSnapshot = await adminDb.collection("usuarios").doc(dados.usuarioId).get();
        const solicitante = solicitanteSnapshot.data();
        if (
          usuario?.perfil === "gestor" &&
          (solicitante?.perfil !== "funcionario" || solicitante.setorId !== usuario.setorId)
        ) return null;
        return { id: documento.id, ...dados, usuarioNome: solicitante?.nome ?? dados.usuarioNome };
      }));
    return NextResponse.json(solicitacoes.filter((solicitacao) => solicitacao !== null));
  } catch (erro) {
    const mensagem = (erro as Error).message ?? "";
    if (mensagem.includes("restrita") || mensagem.includes("inativo") || mensagem.includes("não encontrado") || mensagem.includes("não verificado")) {
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
      const { uid, usuario } = await verificarTokenAtivo(idToken);
      if (!body.novoHorario || !body.motivo || body.motivo.trim().length < 5) {
        return NextResponse.json({ erro: "Dados da solicitação inválidos." }, { status: 400 });
      }
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(body.novoHorario)) {
        return NextResponse.json({ erro: "Horário inválido." }, { status: 400 });
      }

      // Sem registroId: solicitação de um ponto que nunca foi batido (dia
      // esquecido, ausência, sistema fora do ar etc.) — em vez de corrigir
      // um horário existente, pede a criação de um registro novo.
      if (!body.registroId) {
        if (!body.data || !/^\d{4}-\d{2}-\d{2}$/.test(body.data) || !body.tipo || !TIPOS.includes(body.tipo)) {
          return NextResponse.json({ erro: "Dados da solicitação inválidos." }, { status: 400 });
        }
        if (body.data > dataLocalHoje()) {
          return NextResponse.json({ erro: "Não é possível solicitar um registro para uma data futura." }, { status: 400 });
        }
        const jaExiste = await adminDb.collection("registros_ponto").doc(idRegistroPonto(uid, body.data, body.tipo)).get();
        if (jaExiste.exists) {
          return NextResponse.json({ erro: "Já existe um registro para esse dia e horário — solicite uma correção nele em vez de um novo registro." }, { status: 409 });
        }
        // Evita duas solicitações pendentes para o mesmo dia/tipo. Filtra em
        // memória (por usuarioId, já indexado por padrão) para não depender
        // de um índice composto no Firestore.
        const pendentesDoUsuario = await adminDb.collection("solicitacoes_correcao").where("usuarioId", "==", uid).get();
        const jaPendente = pendentesDoUsuario.docs.some((documento) => {
          const dados = documento.data();
          return dados.status === "pendente" && dados.data === body.data && dados.tipo === body.tipo;
        });
        if (jaPendente) {
          return NextResponse.json({ erro: "Você já tem uma solicitação pendente para este dia e horário." }, { status: 409 });
        }

        const solicitacao = await adminDb.collection("solicitacoes_correcao").add({
          usuarioId: uid,
          usuarioNome: usuario?.nome ?? null,
          setorId: usuario?.setorId,
          data: body.data,
          tipo: body.tipo,
          novoHorario: body.novoHorario,
          motivo: body.motivo.trim(),
          status: "pendente",
          criadoEm: FieldValue.serverTimestamp(),
        });
        await avisarMudancaDeSolicitacoes();
        return NextResponse.json({ id: solicitacao.id }, { status: 201 });
      }

      const registroSnapshot = await adminDb.collection("registros_ponto").doc(body.registroId).get();
      const registro = registroSnapshot.data();
      if (!registroSnapshot.exists || registro?.usuarioId !== uid) {
        return NextResponse.json({ erro: "Registro inválido." }, { status: 400 });
      }
      const solicitacao = await adminDb.collection("solicitacoes_correcao").add({
        registroId: body.registroId,
        usuarioId: uid,
        usuarioNome: usuario?.nome ?? null,
        setorId: registro.setorId,
        data: registro.data,
        tipo: registro.tipo,
        novoHorario: body.novoHorario,
        motivo: body.motivo.trim(),
        status: "pendente",
        criadoEm: FieldValue.serverTimestamp(),
      });
      await avisarMudancaDeSolicitacoes();
      return NextResponse.json({ id: solicitacao.id }, { status: 201 });
    }

    const { uid, usuario } = await verificarTokenGestorOuAdmin(idToken);
    if (!body.solicitacaoId || !["aprovada", "rejeitada"].includes(body.decisao ?? "")) {
      return NextResponse.json({ erro: "Solicitação ou decisão inválida." }, { status: 400 });
    }

    const solicitacaoRef = adminDb.collection("solicitacoes_correcao").doc(body.solicitacaoId);
    await adminDb.runTransaction(async (transaction) => {
      const solicitacaoSnapshot = await transaction.get(solicitacaoRef);
      if (!solicitacaoSnapshot.exists) throw new Error("SOLICITACAO_NAO_ENCONTRADA");
      const solicitacao = solicitacaoSnapshot.data()!;
      if (solicitacao.status !== "pendente") throw new Error("SOLICITACAO_JA_PROCESSADA");

      const solicitanteSnapshot = await transaction.get(
        adminDb.collection("usuarios").doc(solicitacao.usuarioId)
      );
      const solicitante = solicitanteSnapshot.data();
      if (
        usuario?.perfil === "gestor" &&
        (solicitante?.perfil !== "funcionario" || solicitante.setorId !== usuario.setorId)
      ) {
        throw new Error("CORRECAO_FORA_DO_SETOR");
      }

      const agora = Timestamp.now();
      if (body.decisao === "aprovada") {
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(solicitacao.novoHorario)) {
          throw new Error("HORARIO_INVALIDO");
        }
        // Horários do sistema são locais de Jaboatão (UTC-03:00).
        const dataHora = Timestamp.fromDate(
          new Date(`${solicitacao.data}T${solicitacao.novoHorario}:00-03:00`)
        );

        if (solicitacao.registroId) {
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
          transaction.update(registroRef, {
            dataHora,
            editadoPorCorrecao: true,
            observacao: `Correção aprovada: ${solicitacao.motivo}`,
          });
        } else {
          // Registro retroativo: o ponto nunca existiu, então é criado
          // agora — id determinístico continua impedindo duplicidade, mas
          // sem exigir que o marco anterior já exista: aqui é o admin/gestor
          // revisando manualmente, não o fluxo automático do dia, e o
          // funcionário pode ter esquecido vários marcos em qualquer ordem
          // (ex.: só falta o retorno do almoço, ou o gestor prefere aprovar
          // as solicitações do dia fora de ordem).
          const registroRef = adminDb.collection("registros_ponto").doc(
            idRegistroPonto(solicitacao.usuarioId, solicitacao.data, solicitacao.tipo)
          );
          const registroSnapshot = await transaction.get(registroRef);
          if (registroSnapshot.exists) throw new Error("REGISTRO_JA_EXISTE");
          transaction.create(registroRef, {
            usuarioId: solicitacao.usuarioId,
            setorId: solicitacao.setorId,
            tipo: solicitacao.tipo,
            data: solicitacao.data,
            dataHora,
            origem: "web",
            editadoPorCorrecao: true,
            observacao: `Registro retroativo aprovado: ${solicitacao.motivo}`,
            criadoEm: agora,
          });
        }
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
        // Sem registroId (registro retroativo), usa o id que acabou de ser
        // gerado — nunca undefined, que o Firestore rejeitaria na escrita.
        alvoId: solicitacao.registroId ?? idRegistroPonto(solicitacao.usuarioId, solicitacao.data, solicitacao.tipo),
        detalhes: {
          solicitacaoId: body.solicitacaoId,
          decisao: body.decisao,
          usuarioId: solicitacao.usuarioId,
          novoHorario: solicitacao.novoHorario,
        },
        criadoEm: agora,
      });
    });
    await avisarMudancaDeSolicitacoes();

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
    if (codigo === "REGISTRO_JA_EXISTE") {
      return NextResponse.json({ erro: "Este ponto já foi registrado por outro meio nesse meio-tempo — rejeite esta solicitação." }, { status: 409 });
    }
    if (codigo === "CORRECAO_FORA_DO_SETOR") {
      return NextResponse.json({ erro: "Acesso negado para esta solicitação." }, { status: 403 });
    }
    const mensagem = (erro as Error).message ?? "";
    if (mensagem.includes("restrita") || mensagem.includes("inativo") || mensagem.includes("não encontrado") || mensagem.includes("não verificado")) {
      return NextResponse.json({ erro: "Acesso negado." }, { status: 403 });
    }
    return NextResponse.json({ erro: "Não foi possível processar a correção." }, { status: 500 });
  }
}