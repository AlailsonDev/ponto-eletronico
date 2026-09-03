"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Award, X } from "lucide-react";
import type { Retrospectiva } from "@/types/retrospectiva";
import { formatarMinutos } from "@/lib/formatadores";

export function RetrospectivaModal({ retrospectiva, aberto, onFechar }: { retrospectiva: Retrospectiva; aberto: boolean; onFechar: () => void }) {
  const [tela, setTela] = useState(0);
  const total = 5;
  useEffect(() => { if (aberto) setTela(0); }, [aberto]);
  useEffect(() => {
    if (!aberto) return;
    const teclado = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") onFechar();
      if (evento.key === "ArrowRight") setTela((atual) => Math.min(total - 1, atual + 1));
      if (evento.key === "ArrowLeft") setTela((atual) => Math.max(0, atual - 1));
    };
    window.addEventListener("keydown", teclado);
    return () => window.removeEventListener("keydown", teclado);
  }, [aberto, onFechar]);
  if (!aberto) return null;
  const mes = new Date(`${retrospectiva.periodo}-01T12:00:00`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const telas = [
    <><p className="text-sm uppercase tracking-[0.2em] text-white/60">{mes}</p><h2 className="mt-5 text-4xl font-bold">Sua jornada em retrospectiva</h2><p className="mt-4 text-white/70">Um olhar sobre o caminho que você percorreu.</p></>,
    <><p className="text-sm text-white/60">Você trabalhou</p><strong className="mt-3 block text-6xl font-bold">{retrospectiva.diasTrabalhados}</strong><p className="mt-3 text-xl">dias · {formatarMinutos(retrospectiva.minutosTrabalhados)}</p></>,
    <><p className="text-sm text-white/60">Pontualidade</p><strong className="mt-3 block text-5xl font-bold">{retrospectiva.diasPontuais} de {retrospectiva.diasPrevistos}</strong><p className="mt-3 text-xl">dias com entrada no horário previsto.</p></>,
    <><p className="text-sm text-white/60">Seu destaque</p><h2 className="mt-5 text-3xl font-bold">{retrospectiva.diasJornadaCumprida} dias com a jornada cumprida</h2><p className="mt-4 text-white/70">Você acumulou {formatarMinutos(retrospectiva.minutosAtraso)} em atrasos neste período.</p></>,
    <><Award className="mx-auto h-12 w-12 text-yellow-300" /><p className="mt-5 text-sm uppercase tracking-[0.2em] text-white/60">Você conquistou</p><div className="mt-3 text-7xl">{retrospectiva.insignia.emoji}</div><h2 className="mt-3 text-3xl font-bold">Insígnia {retrospectiva.insignia.name}</h2><p className="mt-3">{retrospectiva.regularidade}% de regularidade</p></>,
  ];
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/80 p-0 sm:p-6" role="dialog" aria-modal="true" aria-label="Retrospectiva da jornada"><div className="relative flex h-full w-full max-w-2xl flex-col justify-between overflow-hidden bg-navy-800 p-6 text-center text-white shadow-2xl sm:h-auto sm:min-h-[560px] sm:rounded-card sm:p-12"><button type="button" onClick={onFechar} aria-label="Fechar retrospectiva" className="absolute right-5 top-5 rounded p-2 text-white/70 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button><div className="flex gap-1 pr-10" aria-label={`Tela ${tela + 1} de ${total}`}>{Array.from({ length: total }, (_, indice) => <span key={indice} className={`h-1 flex-1 rounded-full ${indice <= tela ? "bg-yellow-300" : "bg-white/20"}`} />)}</div><div key={tela} className="flex flex-1 flex-col items-center justify-center motion-safe:animate-[fade-in_400ms_ease-out]">{telas[tela]}</div><div className="flex items-center justify-between gap-3"><button type="button" onClick={() => setTela((atual) => Math.max(0, atual - 1))} disabled={tela === 0} aria-label="Tela anterior" className="rounded p-3 text-white/70 hover:bg-white/10 disabled:invisible"><ArrowLeft className="h-5 w-5" /></button><span className="text-xs text-white/50">{tela + 1} / {total}</span>{tela === total - 1 ? <button type="button" onClick={onFechar} className="rounded-card bg-yellow-300 px-5 py-3 text-sm font-semibold text-navy-950">Concluir</button> : <button type="button" onClick={() => setTela((atual) => Math.min(total - 1, atual + 1))} aria-label="Próxima tela" className="rounded p-3 text-white/70 hover:bg-white/10"><ArrowRight className="h-5 w-5" /></button>}</div></div></div>;
}