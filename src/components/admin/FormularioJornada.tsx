"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Jornada } from "@/types/jornada";
import type { DadosJornada } from "@/services/jornadas.service";

const VALOR_INICIAL: DadosJornada = {
  nome: "",
  entrada: "08:00",
  saidaAlmoco: "12:00",
  retornoAlmoco: "13:00",
  intervaloAlmocoLivre: false,
  saida: "17:00",
  toleranciaMinutos: 10,
  cargaHorariaDiariaMinutos: 480,
  diasTrabalho: [1, 2, 3, 4, 5],
};

const DIAS_SEMANA = [
  { valor: 1, nome: "Segunda" },
  { valor: 2, nome: "Terça" },
  { valor: 3, nome: "Quarta" },
  { valor: 4, nome: "Quinta" },
  { valor: 5, nome: "Sexta" },
  { valor: 6, nome: "Sábado" },
  { valor: 0, nome: "Domingo" },
];

interface FormularioJornadaProps {
  enviando: boolean;
  jornadaEmEdicao: Jornada | null;
  onSubmit: (dados: DadosJornada) => void;
  onCancelarEdicao: () => void;
}

function horarioParaMinutosLocal(horario: string): number {
  const [h, m] = horario.split(":").map(Number);
  return h * 60 + m;
}

export function FormularioJornada({
  enviando,
  jornadaEmEdicao,
  onSubmit,
  onCancelarEdicao,
}: FormularioJornadaProps) {
  const [form, setForm] = useState<DadosJornada>(VALOR_INICIAL);
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);

  // Sincroniza o form quando o admin clica em "editar" numa jornada existente.
  useEffect(() => {
    if (jornadaEmEdicao) {
      const { id: _id, ...dados } = jornadaEmEdicao;
      setForm({ ...dados, diasTrabalho: dados.diasTrabalho ?? [1, 2, 3, 4, 5] });
    } else {
      setForm(VALOR_INICIAL);
    }
    setErroValidacao(null);
  }, [jornadaEmEdicao]);

  function atualizar<K extends keyof DadosJornada>(campo: K, valor: DadosJornada[K]) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function alternarDia(dia: number) {
    const diasAtuais = form.diasTrabalho ?? [1, 2, 3, 4, 5];
    atualizar(
      "diasTrabalho",
      diasAtuais.includes(dia) ? diasAtuais.filter((item) => item !== dia) : [...diasAtuais, dia].sort()
    );
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErroValidacao(null);

    // Validação de sanidade: os horários precisam estar em ordem cronológica.
    // Não impede jornadas noturnas/incomuns no banco, só evita erro de digitação óbvio.
    const entrada = horarioParaMinutosLocal(form.entrada);
    const saida = horarioParaMinutosLocal(form.saida);

    const horariosValidos = form.intervaloAlmocoLivre
      ? entrada < saida
      : (() => {
          const saidaAlmoco = horarioParaMinutosLocal(form.saidaAlmoco);
          const retornoAlmoco = horarioParaMinutosLocal(form.retornoAlmoco);
          return entrada < saidaAlmoco && saidaAlmoco < retornoAlmoco && retornoAlmoco < saida;
        })();

    if (!horariosValidos) {
      setErroValidacao(
        form.intervaloAlmocoLivre
          ? "Os horários de entrada e saída precisam estar em ordem."
          : "Os horários precisam estar em ordem: entrada < saída para almoço < retorno < saída."
      );
      return;
    }

    if (!form.diasTrabalho?.length) {
      setErroValidacao("Selecione pelo menos um dia de trabalho.");
      return;
    }

    onSubmit(form);
    if (!jornadaEmEdicao) setForm(VALOR_INICIAL);
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
      <div className="sm:col-span-2">
        <Input
          label="Nome da jornada"
          required
          value={form.nome}
          onChange={(e) => atualizar("nome", e.target.value)}
          placeholder="Ex: Padrão 8h"
        />
      </div>

      <Input
        label="Entrada"
        type="time"
        required
        value={form.entrada}
        onChange={(e) => atualizar("entrada", e.target.value)}
      />
      <Input
        label="Saída para almoço"
        type="time"
        required={!form.intervaloAlmocoLivre}
        disabled={form.intervaloAlmocoLivre}
        value={form.saidaAlmoco}
        onChange={(e) => atualizar("saidaAlmoco", e.target.value)}
      />
      <Input
        label="Retorno do almoço"
        type="time"
        required={!form.intervaloAlmocoLivre}
        disabled={form.intervaloAlmocoLivre}
        value={form.retornoAlmoco}
        onChange={(e) => atualizar("retornoAlmoco", e.target.value)}
      />
      <label className="flex items-center gap-2 self-end pb-2 font-body text-sm text-ink-600 sm:col-span-2">
        <input
          type="checkbox"
          checked={form.intervaloAlmocoLivre ?? false}
          onChange={(e) => atualizar("intervaloAlmocoLivre", e.target.checked)}
          className="h-4 w-4 accent-navy-800"
        />
        Intervalo de almoço livre
      </label>
      <Input
        label="Saída"
        type="time"
        required
        value={form.saida}
        onChange={(e) => atualizar("saida", e.target.value)}
      />

      <Input
        label="Tolerância (minutos)"
        type="number"
        min={0}
        required
        value={form.toleranciaMinutos}
        onChange={(e) => atualizar("toleranciaMinutos", Number(e.target.value))}
      />
      <Input
        label="Carga horária diária (minutos)"
        type="number"
        min={0}
        required
        value={form.cargaHorariaDiariaMinutos}
        onChange={(e) => atualizar("cargaHorariaDiariaMinutos", Number(e.target.value))}
      />

      <fieldset className="sm:col-span-2">
        <legend className="mb-2 font-body text-sm font-medium text-ink-700">Dias de trabalho</legend>
        <div className="flex flex-wrap gap-2">
          {DIAS_SEMANA.map((dia) => (
            <label
              key={dia.valor}
              className="flex cursor-pointer items-center gap-2 rounded-card border border-surface-border px-3 py-2 font-body text-sm text-ink-600"
            >
              <input
                type="checkbox"
                checked={(form.diasTrabalho ?? [1, 2, 3, 4, 5]).includes(dia.valor)}
                onChange={() => alternarDia(dia.valor)}
                className="h-4 w-4 accent-navy-800"
              />
              {dia.nome}
            </label>
          ))}
        </div>
      </fieldset>

      {erroValidacao && (
        <p className="sm:col-span-2 font-body text-sm text-red-600">{erroValidacao}</p>
      )}

      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" carregando={enviando}>
          {jornadaEmEdicao ? "Salvar alterações" : "Criar jornada"}
        </Button>
        {jornadaEmEdicao && (
          <Button type="button" variant="secondary" onClick={onCancelarEdicao}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
