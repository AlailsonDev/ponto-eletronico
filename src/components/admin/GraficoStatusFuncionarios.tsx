"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from "recharts";
import type { ContadoresDashboard } from "@/lib/statusFuncionarioHoje";

const CORES = {
  trabalhando: "#0E7C86",
  emAlmoco: "#8A93A6",
  concluidos: "#15803D",
  atrasados: "#C2410C",
  ausentes: "#4A5266",
};

export function GraficoStatusFuncionarios({ contadores }: { contadores: ContadoresDashboard }) {
  const dados = [
    { nome: "Trabalhando", valor: contadores.trabalhando, cor: CORES.trabalhando },
    { nome: "Em almoço", valor: contadores.emAlmoco, cor: CORES.emAlmoco },
    { nome: "Concluído", valor: contadores.concluidos, cor: CORES.concluidos },
    { nome: "Atrasados", valor: contadores.atrasados, cor: CORES.atrasados },
    { nome: "Ausentes", valor: contadores.ausentes, cor: CORES.ausentes },
  ];

  return (
    <div className="rounded-card border border-surface-border bg-white p-5">
      <h2 className="mb-4 font-display text-sm font-semibold text-ink-900">
        Distribuição por status hoje
      </h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E4E7EC" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#8A93A6" }} />
            <YAxis
              type="category"
              dataKey="nome"
              width={90}
              tick={{ fontSize: 12, fill: "#4A5266" }}
            />
            <Tooltip
              cursor={{ fill: "#F7F8FA" }}
              contentStyle={{ borderRadius: 8, border: "1px solid #E4E7EC", fontSize: 13 }}
            />
            <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
              {dados.map((item) => (
                <Cell key={item.nome} fill={item.cor} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
