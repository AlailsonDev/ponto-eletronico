export type NivelInsignia = "bronze" | "prata" | "ouro" | "diamante";

// Timestamps do Admin SDK, depois de passarem por NextResponse.json(), viram
// objeto plano (não uma instância de Timestamp com .toDate()) — por isso não
// usamos o tipo Timestamp do client SDK aqui.
export interface TimestampSerializado {
  _seconds: number;
  _nanoseconds: number;
}

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
  visualizadaEm?: TimestampSerializado | null;
  criadaEm?: TimestampSerializado | null;
}