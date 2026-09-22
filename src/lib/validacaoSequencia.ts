import { SEQUENCIA_PONTO, type RegistroPonto, type TipoRegistro } from "@/types/registroPonto";

/**
 * Determina o próximo tipo de registro permitido, dado os registros já
 * feitos hoje. Isso é só para guiar a UI (mostrar o botão certo) —
 * a validação que realmente importa está nas Security Rules, que o
 * cliente não pode burlar mesmo manipulando o estado local.
 */
export function proximoTipoPermitido(
  registrosHoje: RegistroPonto[]
): TipoRegistro | null {
  const tiposFeitos = new Set(registrosHoje.map((r) => r.tipo));

  for (const tipo of SEQUENCIA_PONTO) {
    if (!tiposFeitos.has(tipo)) {
      return tipo;
    }
  }

  return null; // jornada do dia concluída
}

export function jornadaConcluidaHoje(registrosHoje: RegistroPonto[]): boolean {
  return proximoTipoPermitido(registrosHoje) === null;
}

const RÓTULOS_BOTAO: Record<TipoRegistro, string> = {
  ENTRADA: "Registrar entrada",
  SAIDA_ALMOCO: "Saída para almoço",
  RETORNO_ALMOCO: "Registrar retorno",
  SAIDA: "Registrar saída",
};

export function rotuloBotaoParaTipo(tipo: TipoRegistro): string {
  return RÓTULOS_BOTAO[tipo];
}

/**
 * Tipo que precisa existir antes de um dado tipo ser aceito (ex.: só é
 * possível bater SAIDA_ALMOCO depois de ENTRADA). Compartilhado entre a
 * criação de ponto do dia (/api/ponto) e a aprovação de registros
 * retroativos solicitados via correção (/api/correcoes) — mesma regra de
 * sequência em ambos os lugares.
 */
export const TIPO_ANTERIOR: Partial<Record<TipoRegistro, TipoRegistro>> = {
  SAIDA_ALMOCO: "ENTRADA",
  RETORNO_ALMOCO: "SAIDA_ALMOCO",
  SAIDA: "RETORNO_ALMOCO",
};

/** ID determinístico de um registro de ponto: "{usuarioId}_{data}_{tipo}". */
export function idRegistroPonto(usuarioId: string, data: string, tipo: TipoRegistro): string {
  return `${usuarioId}_${data}_${tipo}`;
}
