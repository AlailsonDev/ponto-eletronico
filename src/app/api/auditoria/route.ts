import { NextRequest, NextResponse } from "next/server";
import { adminDb, verificarTokenAdmin } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
  try {
    const header = request.headers.get("authorization");
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
    await verificarTokenAdmin(token);

    const limite = Math.min(Number(request.nextUrl.searchParams.get("limite")) || 50, 100);
    const snapshot = await adminDb.collection("auditoria").orderBy("criadoEm", "desc").limit(limite).get();
    const registros = snapshot.docs.map((documento) => {
      const dados = documento.data();
      return {
        id: documento.id,
        ...dados,
        criadoEm: dados.criadoEm?.toDate?.().toISOString() ?? null,
      } as {
        id: string;
        administradorId: string;
        alvoId: string;
        detalhes: Record<string, unknown>;
        criadoEm: string | null;
      };
    });
    const ids = new Set<string>();
    for (const registro of registros) {
      ids.add(registro.administradorId);
      ids.add(registro.alvoId);
      const usuarioId = registro.detalhes?.usuarioId;
      if (typeof usuarioId === "string") ids.add(usuarioId);
    }
    const usuarios = await Promise.all(
      [...ids].map(async (id) => [id, (await adminDb.collection("usuarios").doc(id).get()).data()?.nome] as const)
    );
    const nomes = new Map(usuarios.filter(([, nome]) => nome));

    return NextResponse.json(registros.map((registro) => ({
      ...registro,
      administradorNome: nomes.get(registro.administradorId) ?? null,
      alvoNome: nomes.get(registro.alvoId) ?? null,
      usuarioNome: typeof registro.detalhes?.usuarioId === "string"
        ? nomes.get(registro.detalhes.usuarioId) ?? null
        : null,
    })));
  } catch (erro) {
    const mensagem = (erro as Error).message ?? "";
    if (mensagem.includes("restrita") || mensagem.includes("inativo") || mensagem.includes("não encontrado") || mensagem.includes("não verificado")) {
      return NextResponse.json({ erro: "Acesso negado." }, { status: 403 });
    }
    return NextResponse.json({ erro: "Não foi possível carregar a auditoria." }, { status: 500 });
  }
}