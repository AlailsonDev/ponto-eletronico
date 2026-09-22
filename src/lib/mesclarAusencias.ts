import type { CategoriaAusencia, ResumoJornadaDia, SolicitacaoCorrecao } from "@/types/registroPonto";

export interface DiaComAusencia extends ResumoJornadaDia {
  ausencia?: { categoria: CategoriaAusencia; motivo: string };
}

export const RÓTULOS_CATEGORIA_AUSENCIA: Record<CategoriaAusencia, string> = {
  atestado: "Atestado médico",
  folga: "Folga",
  outro: "Ausência justificada",
};

/**
 * Combina os dias com registro de ponto (`dias`) com as justificativas de
 * ausência já aprovadas (`ausencias` — o chamador já filtrou por usuário e
 * período). Um dia com falta justificada e nenhum ponto batido não existe em
 * `dias` (que só cobre dias com ao menos um marco), então entra aqui como
 * linha própria, com o motivo anexado. Não ordena — o chamador decide.
 */
export function mesclarComAusencias(
  dias: ResumoJornadaDia[],
  ausencias: SolicitacaoCorrecao[]
): DiaComAusencia[] {
  const mapaAusencias = new Map(ausencias.filter((item) => item.categoria).map((item) => [item.data, item]));
  const datasComRegistro = new Set(dias.map((dia) => dia.data));
  const soAusencia: DiaComAusencia[] = Array.from(mapaAusencias.keys())
    .filter((data) => !datasComRegistro.has(data))
    .map((data) => ({ data, incompleta: false }));

  return [...dias, ...soAusencia].map((dia) => {
    const ausencia = mapaAusencias.get(dia.data);
    return ausencia?.categoria ? { ...dia, ausencia: { categoria: ausencia.categoria, motivo: ausencia.motivo } } : dia;
  });
}
