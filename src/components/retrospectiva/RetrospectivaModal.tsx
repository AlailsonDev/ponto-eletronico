"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, PartyPopper, X } from "lucide-react";
import type { NivelInsignia, Retrospectiva } from "@/types/retrospectiva";
import { formatarMinutos } from "@/lib/formatadores";

const LIMIAR_DESLIZE_PX = 40;

/** Frase de acordo com a fração de dias que bateram um critério (0 a 1). */
function fraseParaRatio(ratio: number, faixas: [number, string][]): string {
  return faixas.find(([minimo]) => ratio >= minimo)?.[1] ?? faixas.at(-1)![1];
}

const TEMA_INSIGNIA: Record<NivelInsignia, { fundo: string; frase: string }> = {
  bronze: {
    fundo: "from-amber-900 via-navy-800 to-navy-900",
    frase: "🥉 Toda jornada começa com um primeiro passo firme. Bora destravar a próxima faixa!",
  },
  prata: {
    fundo: "from-slate-500 via-navy-800 to-navy-900",
    frase: "🥈 Muito bem! Sua consistência está brilhando — o ouro está logo ali.",
  },
  ouro: {
    fundo: "from-yellow-600 via-navy-800 to-navy-900",
    frase: "🥇 Uau, que mês de ouro! Sua regularidade é exemplo pra equipe.",
  },
  diamante: {
    fundo: "from-cyan-500 via-navy-800 to-navy-900",
    frase: "💎 Impecável! Poucas pessoas mantêm uma regularidade tão brilhante.",
  },
};

export function RetrospectivaModal({ retrospectiva, aberto, onFechar }: { retrospectiva: Retrospectiva; aberto: boolean; onFechar: () => void }) {
  const [tela, setTela] = useState(0);
  const total = 5;
  const toqueInicio = useRef<{ x: number; y: number } | null>(null);
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
  function aoTocarInicio(evento: React.TouchEvent) {
    const toque = evento.touches[0];
    toqueInicio.current = { x: toque.clientX, y: toque.clientY };
  }
  function aoTocarFim(evento: React.TouchEvent) {
    const inicio = toqueInicio.current;
    toqueInicio.current = null;
    if (!inicio) return;
    const toque = evento.changedTouches[0];
    const deltaX = toque.clientX - inicio.x;
    const deltaY = toque.clientY - inicio.y;
    // Ignora deslizes curtos ou majoritariamente verticais (rolagem).
    if (Math.abs(deltaX) < LIMIAR_DESLIZE_PX || Math.abs(deltaX) < Math.abs(deltaY)) return;
    if (deltaX < 0) setTela((atual) => Math.min(total - 1, atual + 1));
    else setTela((atual) => Math.max(0, atual - 1));
  }
  if (!aberto) return null;
  const mes = new Date(`${retrospectiva.periodo}-01T12:00:00`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const divisor = retrospectiva.diasPrevistos || 1;
  const ratioTrabalhados = retrospectiva.diasTrabalhados / divisor;
  const ratioPontuais = retrospectiva.diasPontuais / divisor;
  const ratioJornada = retrospectiva.diasJornadaCumprida / divisor;
  const tema = TEMA_INSIGNIA[retrospectiva.insignia.level];

  const fraseTrabalhados = fraseParaRatio(ratioTrabalhados, [
    [0.95, "Presença exemplar o mês inteiro! 🔥"],
    [0.8, "Muito bem, sua constância impressiona! 👏"],
    [0.5, "Você segurou a rotina — bora destravar o resto! 💪"],
    [0, "Esse mês foi corrido — bora recomeçar com tudo! 🚀"],
  ]);
  const fraseVerbo = fraseParaRatio(ratioPontuais, [
    [0.9, "Raramente alguém chega tão em cima da hora quanto você! ⏰✨"],
    [0.7, "Boa pontualidade — só alguns ajustes pra arrasar de vez. 👍"],
    [0.4, "Dá pra ajustar o relógio um pouquinho, hein? 😅"],
    [0, "Bora repensar o despertador no próximo mês! ⏰"],
  ]);
  const fraseJornada = fraseParaRatio(ratioJornada, [
    [0.9, "Carga horária em dia o mês inteiro! 🎯"],
    [0.7, "Boa entrega de horas — falta pouco pra perfeição. 💼"],
    [0.4, "Ainda dá pra fechar mais dias com a jornada completa. ⚖️"],
    [0, "Bora equilibrar melhor as horas no próximo mês. ⚖️"],
  ]);

  const telas = [
    <>
      <p className="text-sm uppercase tracking-[0.2em] text-white/60">👋 {mes}</p>
      <h2 className="mt-5 text-4xl font-bold">Sua jornada em retrospectiva</h2>
      <p className="mt-4 text-white/70">Um olhar animado sobre o caminho que você percorreu. ✨</p>
    </>,
    <>
      <p className="text-sm text-white/60">💪 Você trabalhou</p>
      <strong className="mt-3 block text-6xl font-bold">{retrospectiva.diasTrabalhados}</strong>
      <p className="mt-3 text-xl">dias · {formatarMinutos(retrospectiva.minutosTrabalhados)}</p>
      <p className="mt-4 text-white/70">{fraseTrabalhados}</p>
    </>,
    <>
      <p className="text-sm text-white/60">⏰ Pontualidade</p>
      <strong className="mt-3 block text-5xl font-bold">{retrospectiva.diasPontuais} de {retrospectiva.diasPrevistos}</strong>
      <p className="mt-3 text-xl">dias com entrada no horário previsto.</p>
      <p className="mt-4 text-white/70">{fraseVerbo}</p>
    </>,
    <>
      <p className="text-sm text-white/60">🎯 Seu destaque</p>
      <h2 className="mt-5 text-3xl font-bold">{retrospectiva.diasJornadaCumprida} dias com a jornada cumprida</h2>
      <p className="mt-4 text-white/70">Você acumulou {formatarMinutos(retrospectiva.minutosAtraso)} em atrasos neste período.</p>
      <p className="mt-4 text-white/70">{fraseJornada}</p>
    </>,
    <>
      <PartyPopper className="mx-auto h-12 w-12 text-yellow-300" />
      <p className="mt-5 text-sm uppercase tracking-[0.2em] text-white/60">🎉 Você conquistou</p>
      <div className="mt-3 text-7xl">{retrospectiva.insignia.emoji}</div>
      <h2 className="mt-3 text-3xl font-bold">Insígnia {retrospectiva.insignia.name}</h2>
      <p className="mt-3">{retrospectiva.regularidade}% de regularidade</p>
      <p className="mt-4 max-w-sm text-white/80">{tema.frase}</p>
    </>,
  ];
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-navy-950/80 p-0 sm:p-6" role="dialog" aria-modal="true" aria-label="Retrospectiva da jornada">
      <div
        className={`relative flex h-full w-full max-w-2xl touch-pan-y flex-col justify-between overflow-hidden bg-gradient-to-br p-6 text-center text-white shadow-2xl transition-colors duration-500 sm:h-auto sm:min-h-[560px] sm:rounded-card sm:p-12 ${tela === total - 1 ? tema.fundo : "from-navy-800 via-navy-800 to-navy-800"}`}
        onTouchStart={aoTocarInicio}
        onTouchEnd={aoTocarFim}
      >
        <button type="button" onClick={onFechar} aria-label="Fechar retrospectiva" className="absolute right-5 top-5 rounded p-2 text-white/70 hover:bg-white/10 hover:text-white">
          <X className="h-5 w-5" />
        </button>
        <div className="flex gap-1 pr-10" aria-label={`Tela ${tela + 1} de ${total}`}>
          {Array.from({ length: total }, (_, indice) => (
            <span key={indice} className={`h-1 flex-1 rounded-full ${indice <= tela ? "bg-yellow-300" : "bg-white/20"}`} />
          ))}
        </div>
        <div key={tela} className="flex flex-1 flex-col items-center justify-center motion-safe:animate-[fade-in_400ms_ease-out]">
          {telas[tela]}
        </div>
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => setTela((atual) => Math.max(0, atual - 1))} disabled={tela === 0} aria-label="Tela anterior" className="rounded p-3 text-white/70 hover:bg-white/10 disabled:invisible">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-xs text-white/50">{tela + 1} / {total}</span>
          {tela === total - 1 ? (
            <button type="button" onClick={onFechar} className="rounded-card bg-yellow-300 px-5 py-3 text-sm font-semibold text-navy-950">
              Concluir
            </button>
          ) : (
            <button type="button" onClick={() => setTela((atual) => Math.min(total - 1, atual + 1))} aria-label="Próxima tela" className="rounded p-3 text-white/70 hover:bg-white/10">
              <ArrowRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
