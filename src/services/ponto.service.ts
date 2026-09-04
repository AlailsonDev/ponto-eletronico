import {
  onSnapshot,
  getDocs,
  query,
  collection,
  where,
  addDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import type {
  RegistroPonto,
  SolicitacaoCorrecao,
  TipoRegistro,
} from "@/types/registroPonto";
import type { Usuario } from "@/types/usuario";

/**
 * Isso é o que permite a Security Rule validar a sequência (ENTRADA antes de
 * SAIDA_ALMOCO, etc.) só com exists() em IDs previsíveis, sem precisar de
 * uma query por "último registro". Como bônus, tentar criar o mesmo tipo
 * duas vezes no mesmo dia vira uma operação de update sobre um doc já
 * existente — e update é bloqueado pela regra, então duplicidade é
 * impossível mesmo sem checagem extra no client.
 */
const ERROS_AMIGAVEIS: Record<string, string> = {
  "permission-denied":
    "Não foi possível registrar. Verifique se este ponto já não foi batido hoje, ou se a sequência está correta.",
  unavailable: "Sem conexão com o servidor. Tente novamente em instantes.",
};

export function traduzirErroPonto(codigo: string): string {
  return ERROS_AMIGAVEIS[codigo] ?? "Não foi possível registrar o ponto. Tente novamente.";
}

export async function registrarPonto(
  usuario: Usuario,
  data: string,
  tipo: TipoRegistro,
  opcoes: { latitude?: number; longitude?: number; precisaoMetros?: number } = {}
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Sua sessão expirou. Faça login novamente.");
  const resposta = await fetch("/api/ponto", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
    body: JSON.stringify({ data, tipo, ...opcoes }),
  });
  const dados = await resposta.json();
  if (!resposta.ok) {
    const erro = new Error(dados.erro ?? "Não foi possível registrar o ponto.") as Error & { code?: string };
    erro.code = dados.codigo;
    throw erro;
  }
}

/**
 * Escuta em tempo real os registros de um usuário em uma data específica.
 * Único listener ativo por vez no dashboard do funcionário — sem polling.
 */
export function observarRegistrosDoDia(
  usuarioId: string,
  data: string,
  callback: (registros: RegistroPonto[]) => void,
  onError?: (erro: unknown) => void
): Unsubscribe {
  const q = query(
    collection(db, "registros_ponto"),
    where("usuarioId", "==", usuarioId),
    where("data", "==", data)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const registros = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data({ serverTimestamps: "estimate" }) } as RegistroPonto)
      );
      callback(registros);
    },
    onError
  );
}

/**
 * Busca (uma única vez, sem listener) os registros de um usuário em um
 * período. Usada pela tela de histórico — diferente do dashboard do dia,
 * histórico não precisa de tempo real, então evitamos manter um listener
 * aberto o tempo todo (impacto direto no consumo do Firestore).
 *
 * Busca primeiro pelo usuário e filtra o período localmente. Isso evita
 * depender da implantação de um índice composto no projeto Firebase e
 * continua limitado aos registros do próprio usuário.
 */
export async function buscarRegistrosPeriodo(
  usuarioId: string,
  dataInicio: string,
  dataFim: string
): Promise<RegistroPonto[]> {
  const q = query(
    collection(db, "registros_ponto"),
    where("usuarioId", "==", usuarioId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data({ serverTimestamps: "estimate" }) } as RegistroPonto))
    .filter((registro) => registro.data >= dataInicio && registro.data <= dataFim)
    .sort((a, b) => a.data.localeCompare(b.data));
}

/** Busca os registros de todos os funcionários em um período para relatórios administrativos. */
export async function buscarTodosRegistrosPeriodo(
  dataInicio: string,
  dataFim: string
): Promise<RegistroPonto[]> {
  const q = query(
    collection(db, "registros_ponto"),
    where("data", ">=", dataInicio),
    where("data", "<=", dataFim)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data({ serverTimestamps: "estimate" }) } as RegistroPonto))
    .sort((a, b) => a.data.localeCompare(b.data));
}

export async function buscarRegistrosParaRelatorio(
  dataInicio: string,
  dataFim: string,
  setorId?: string
): Promise<RegistroPonto[]> {
  const filtros = setorId
    ? [where("setorId", "==", setorId)]
    : [where("data", ">=", dataInicio), where("data", "<=", dataFim)];
  const snapshot = await getDocs(query(collection(db, "registros_ponto"), ...filtros));
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data({ serverTimestamps: "estimate" }) } as RegistroPonto))
    .filter((registro) => registro.data >= dataInicio && registro.data <= dataFim)
    .sort((a, b) => a.data.localeCompare(b.data));
}

export async function criarSolicitacaoCorrecao(input: {
  registro: RegistroPonto;
  novoHorario: string;
  motivo: string;
  idToken: string;
}): Promise<void> {
  const resposta = await fetch("/api/correcoes", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${input.idToken}` },
    body: JSON.stringify({
      acao: "criar",
      registroId: input.registro.id,
      novoHorario: input.novoHorario,
      motivo: input.motivo.trim(),
    }),
  });
  if (!resposta.ok) throw new Error("SOLICITACAO_NAO_ENVIADA");
}

export async function buscarSolicitacoesCorrecao(
  usuarioId: string
): Promise<SolicitacaoCorrecao[]> {
  const solicitacoes = await getDocs(
    query(collection(db, "solicitacoes_correcao"), where("usuarioId", "==", usuarioId))
  );
  return solicitacoes.docs.map(
    (documento) => ({ id: documento.id, ...documento.data() } as SolicitacaoCorrecao)
  ).sort((a, b) => b.criadoEm?.toMillis() - a.criadoEm?.toMillis());
}

export async function buscarSolicitacoesPendentes(): Promise<SolicitacaoCorrecao[]> {
  const solicitacoes = await getDocs(
    query(collection(db, "solicitacoes_correcao"), where("status", "==", "pendente"))
  );
  return solicitacoes.docs.map(
    (documento) => ({ id: documento.id, ...documento.data() } as SolicitacaoCorrecao)
  ).sort((a, b) => a.criadoEm?.toMillis() - b.criadoEm?.toMillis());
}

/**
 * Escuta em tempo real TODOS os registros de um dia, sem filtro de usuário —
 * usada pelo dashboard administrativo. Single-field equality em "data" não
 * exige índice composto novo (Firestore indexa campos únicos por padrão).
 *
 * Único listener na tela inteira do admin, atualizando ~40 funcionários de
 * uma vez, em vez de um listener por funcionário — é isso que mantém o
 * custo baixo mesmo com tempo real ligado.
 */
export function observarRegistrosDoDiaTodos(
  data: string,
  callback: (registros: RegistroPonto[]) => void,
  onError?: (erro: unknown) => void
): Unsubscribe {
  const q = query(collection(db, "registros_ponto"), where("data", "==", data));

  return onSnapshot(
    q,
    (snapshot) => {
      const registros = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data({ serverTimestamps: "estimate" }) } as RegistroPonto)
      );
      callback(registros);
    },
    onError
  );
}
