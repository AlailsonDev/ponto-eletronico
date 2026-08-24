import type { Timestamp } from "firebase/firestore";

export type TipoRegistro = "ENTRADA" | "SAIDA_ALMOCO" | "RETORNO_ALMOCO" | "SAIDA";

// Ordem canônica da sequência — usada tanto na UI quanto na validação.
export const SEQUENCIA_PONTO: TipoRegistro[] = [
  "ENTRADA",
  "SAIDA_ALMOCO",
  "RETORNO_ALMOCO",
  "SAIDA",
];

export interface RegistroPonto {
  id: string;
  usuarioId: string;
  setorId: string; // desnormalizado para evitar leituras extras nos dashboards
  tipo: TipoRegistro;
  data: string; // "YYYY-MM-DD", chave de consulta
  // Pode ser null no snapshot inicial, enquanto o serverTimestamp() é resolvido.
  dataHora: Timestamp | null;
  ip?: string;
  latitude?: number;
  longitude?: number;
  observacao?: string;
  origem: "web" | "qrcode"; // "qrcode" preparado para uso futuro
  editadoPorCorrecao: boolean;
}

export type StatusSolicitacaoCorrecao = "pendente" | "aprovada" | "rejeitada";

export interface SolicitacaoCorrecao {
  id: string;
  registroId: string;
  usuarioId: string;
  setorId: string;
  data: string;
  tipo: TipoRegistro;
  novoHorario: string; // "HH:mm"
  motivo: string;
  status: StatusSolicitacaoCorrecao;
  criadoEm: Timestamp;
  processadoEm?: Timestamp;
  processadoPor?: string;
  resposta?: string;
}

export interface ResumoJornadaDia {
  data: string;
  entrada?: RegistroPonto;
  saidaAlmoco?: RegistroPonto;
  retornoAlmoco?: RegistroPonto;
  saida?: RegistroPonto;
  minutosTrabalhados?: number;
  minutosIntervalo?: number;
  minutosAtraso?: number;
  minutosHoraExtra?: number;
  incompleta: boolean;
}
