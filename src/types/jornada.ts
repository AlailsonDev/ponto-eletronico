export interface Jornada {
  id: string;
  nome: string;
  entrada: string; // "08:00"
  saidaAlmoco: string; // "12:00"
  retornoAlmoco: string; // "13:00"
  saida: string; // "17:00"
  toleranciaMinutos: number;
  cargaHorariaDiariaMinutos: number; // ex: 480 para 8h
}
