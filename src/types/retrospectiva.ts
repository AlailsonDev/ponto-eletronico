import type { Timestamp } from "firebase/firestore";

export type NivelInsignia = "bronze" | "prata" | "ouro" | "diamante";

export interface InsigniaRegularidade {
  level: NivelInsignia;
  score: number;
  name: string;
  emoji: string;
  description: string;
  faixaMinima: number;
}

export interface Retrospectiva {
  id: string;
  usuarioId: string;
  periodo: string;
  dataInicio: string;
  dataFim: string;
  diasPrevistos: number;
  diasTrabalhados: number;
  diasPontuais: number;
  diasJornadaCumprida: number;
  diasComAjuste: number;
  minutosTrabalhados: number;
  minutosAtraso: number;
  regularidade: number;
  insignia: InsigniaRegularidade;
  visualizadaEm?: Timestamp | null;
  criadaEm?: Timestamp | null;
}