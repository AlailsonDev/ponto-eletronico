export interface Jornada {
  id: string;
  nome: string;
  entrada: string; // "08:00"
  saidaAlmoco: string; // "12:00"
  retornoAlmoco: string; // "13:00"
  intervaloAlmocoLivre?: boolean;
  saida: string; // "17:00"
  toleranciaMinutos: number;
  cargaHorariaDiariaMinutos: number; // ex: 480 para 8h
  // JavaScript: 0 = domingo, 1 = segunda ... 6 = sábado.
  diasTrabalho?: number[];
}

export function diasTrabalhoDaJornada(jornada: Jornada | null): number[] {
  return jornada?.diasTrabalho ?? [1, 2, 3, 4, 5];
}
