import {
  doc,
  setDoc,
  serverTimestamp,
  onSnapshot,
  getDocs,
  query,
  collection,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { RegistroPonto, TipoRegistro } from "@/types/registroPonto";
import type { Usuario } from "@/types/usuario";

/**
 * ID determinístico: {usuarioId}_{data}_{tipo}.
 * Isso é o que permite a Security Rule validar a sequência (ENTRADA antes de
 * SAIDA_ALMOCO, etc.) só com exists() em IDs previsíveis, sem precisar de
 * uma query por "último registro". Como bônus, tentar criar o mesmo tipo
 * duas vezes no mesmo dia vira uma operação de update sobre um doc já
 * existente — e update é bloqueado pela regra, então duplicidade é
 * impossível mesmo sem checagem extra no client.
 */
function idRegistro(usuarioId: string, data: string, tipo: TipoRegistro): string {
  return `${usuarioId}_${data}_${tipo}`;
}

interface RegistrarPontoOpcoes {
  observacao?: string;
  latitude?: number;
  longitude?: number;
}

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
  opcoes: RegistrarPontoOpcoes = {}
): Promise<void> {
  const id = idRegistro(usuario.uid, data, tipo);
  const ref = doc(db, "registros_ponto", id);

  // Campos undefined são omitidos (Firestore não aceita undefined) —
  // por isso montamos o objeto condicionalmente em vez de espalhar opcoes.
  const payload: Record<string, unknown> = {
    usuarioId: usuario.uid,
    setorId: usuario.setorId,
    tipo,
    data,
    dataHora: serverTimestamp(),
    origem: "web",
    editadoPorCorrecao: false,
  };
  if (opcoes.observacao) payload.observacao = opcoes.observacao;
  if (opcoes.latitude !== undefined) payload.latitude = opcoes.latitude;
  if (opcoes.longitude !== undefined) payload.longitude = opcoes.longitude;

  // IP não é capturado aqui: o navegador não tem acesso confiável ao IP
  // público do dispositivo. Isso fica para uma API Route futura que recebe
  // a requisição e lê o IP do cabeçalho no servidor (ver seção de riscos).
  await setDoc(ref, payload);
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
