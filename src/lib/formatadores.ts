import type { Timestamp } from "firebase/firestore";

/** Formata minutos totais em "8h03" (ou "0h00" se zero/negativo). */
export function formatarMinutos(minutos: number | undefined): string {
  if (!minutos || minutos <= 0) return "0h00";
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return `${horas}h${String(resto).padStart(2, "0")}`;
}

/** Formata um Timestamp do Firestore em "HH:MM". Retorna "--:--" se ausente. */
export function formatarHorario(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) return "--:--";
  return timestamp.toDate().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Retorna a data de hoje no formato "YYYY-MM-DD", no fuso local do navegador. */
export function dataHojeISO(): string {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

/** Converte "HH:MM" em minutos desde a meia-noite. */
export function horarioParaMinutos(horario: string): number {
  const [h, m] = horario.split(":").map(Number);
  return h * 60 + m;
}

/** Extrai minutos desde a meia-noite de um Timestamp (hora local). */
export function timestampParaMinutosDoDia(timestamp: Timestamp | null | undefined): number | undefined {
  if (!timestamp) return undefined;
  const data = timestamp.toDate();
  return data.getHours() * 60 + data.getMinutes();
}

/** Retorna [primeiroDia, ultimoDia] do mês (formato "YYYY-MM-DD") para um
 * dado "YYYY-MM". Usado pelo filtro rápido "este mês" do histórico. */
export function limitesDoMes(anoMes: string): [string, string] {
  const [ano, mes] = anoMes.split("-").map(Number);
  const primeiroDia = `${anoMes}-01`;
  const ultimoDiaNum = new Date(ano, mes, 0).getDate(); // dia 0 do mês seguinte = último dia deste mês
  const ultimoDia = `${anoMes}-${String(ultimoDiaNum).padStart(2, "0")}`;
  return [primeiroDia, ultimoDia];
}

/** "YYYY-MM" do mês atual, no fuso local. */
export function mesAtualISO(): string {
  return dataHojeISO().slice(0, 7);
}

/** Formata "YYYY-MM-DD" em "20/08" (curto, para tabela) ou com ano se
 * fromatoLongo=true ("20 de agosto de 2026"). */
export function formatarDataBR(dataISO: string, formatoLongo = false): string {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);
  if (formatoLongo) {
    return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  }
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function saudacaoPorHorario(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}
