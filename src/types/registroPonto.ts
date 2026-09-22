import type { Timestamp } from "firebase/firestore";
import type { MetodoGeolocalizacao } from "@/lib/geolocalizacao";

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
  // true só quando este registro nasceu de uma solicitação de "registro
  // esquecido" aprovada (nunca foi batido ao vivo, sem validação de
  // geolocalização) — usado para excluir o dia da nota de regularidade da
  // retrospectiva, sem puni-lo nem premiá-lo.
  registroRetroativo?: boolean;
  precisaoMetros?: number;
  distanciaMetros?: number;
  localTrabalhoId?: string;
  geolocalizacaoValidada?: boolean;
  metodoGeolocalizacao?: MetodoGeolocalizacao;
}

export type StatusSolicitacaoCorrecao = "pendente" | "aprovada" | "rejeitada";

export type CategoriaAusencia = "atestado" | "folga" | "outro";

export interface SolicitacaoCorrecao {
  id: string;
  // Ausente quando é uma solicitação de registro retroativo (ponto que
  // nunca foi batido) em vez de correção de um horário já registrado.
  registroId?: string;
  usuarioId: string;
  usuarioNome?: string;
  setorId: string;
  data: string;
  // tipo/novoHorario ausentes quando `categoria` está presente — é uma
  // justificativa de ausência (dia inteiro), não uma correção de horário.
  tipo?: TipoRegistro;
  novoHorario?: string; // "HH:mm"
  categoria?: CategoriaAusencia;
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
