import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb, verificarTokenAdmin } from "@/lib/firebase/admin";
import type { NovoUsuarioInput, Perfil } from "@/types/usuario";

const PERFIS_VALIDOS: Perfil[] = ["funcionario", "gestor", "admin"];

const ERROS_AMIGAVEIS: Record<string, string> = {
  "auth/email-already-exists": "Já existe um usuário cadastrado com este e-mail.",
  "auth/invalid-email": "E-mail em formato inválido.",
  "auth/weak-password": "A senha provisória precisa ter pelo menos 6 caracteres.",
};

/**
 * POST /api/usuarios — cria um funcionário (Auth + documento em usuarios/{uid}).
 *
 * Por que isso não é feito direto do client: criar um usuário no Firebase
 * Authentication exige o Admin SDK, que só pode rodar em servidor (nunca no
 * navegador, sob risco de vazar a credencial de serviço). Por isso esta
 * rota existe — e por isso ela MESMA precisa validar quem está chamando,
 * já que o Admin SDK ignora as Security Rules do Firestore.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!idToken) {
      return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
    }

    // Lança erro se o token for inválido, o usuário estiver inativo, ou
    // não for admin — nunca confiamos apenas em "a rota existe".
    await verificarTokenAdmin(idToken);

    const body = (await request.json()) as NovoUsuarioInput;

    const camposObrigatorios: (keyof NovoUsuarioInput)[] = [
      "nome",
      "matricula",
      "email",
      "cargo",
      "setorId",
      "perfil",
      "jornadaId",
      "dataAdmissao",
      "senhaProvisoria",
    ];
    for (const campo of camposObrigatorios) {
      if (!body[campo]) {
        return NextResponse.json({ erro: `Campo obrigatório ausente: ${campo}` }, { status: 400 });
      }
    }
    if (!PERFIS_VALIDOS.includes(body.perfil)) {
      return NextResponse.json({ erro: "Perfil inválido." }, { status: 400 });
    }

    const authUser = await adminAuth.createUser({
      email: body.email,
      password: body.senhaProvisoria,
      displayName: body.nome,
    });

    const agora = FieldValue.serverTimestamp();

    try {
      await adminDb
        .collection("usuarios")
        .doc(authUser.uid)
        .set({
          nome: body.nome,
          matricula: body.matricula,
          email: body.email,
          ...(body.cpf ? { cpf: body.cpf } : {}),
          cargo: body.cargo,
          setorId: body.setorId,
          perfil: body.perfil,
          jornadaId: body.jornadaId,
          status: "ativo",
          dataAdmissao: new Date(body.dataAdmissao),
          criadoEm: agora,
          atualizadoEm: agora,
        });
    } catch (erroFirestore) {
      // Se a escrita no Firestore falhar depois que o Auth já foi criado,
      // desfazemos o Auth para não deixar um usuário "fantasma" (login
      // funcionaria mas sem perfil nenhum, travando no ProtectedRoute).
      await adminAuth.deleteUser(authUser.uid).catch(() => {});
      throw erroFirestore;
    }

    return NextResponse.json({ uid: authUser.uid }, { status: 201 });
  } catch (err) {
    const codigo = (err as { code?: string })?.code ?? "";
    if (codigo) {
      return NextResponse.json(
        { erro: ERROS_AMIGAVEIS[codigo] ?? "Não foi possível criar o funcionário." },
        { status: 400 }
      );
    }

    const mensagem = (err as Error)?.message ?? "";
    if (
      mensagem.includes("restrita a administradores") ||
      mensagem.includes("inativo") ||
      mensagem.includes("não encontrado")
    ) {
      return NextResponse.json({ erro: "Acesso negado." }, { status: 403 });
    }

    return NextResponse.json({ erro: "Erro interno ao criar funcionário." }, { status: 500 });
  }
}
