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
  saida: "17:00",
  toleranciaMinutos: 10,
  cargaHorariaDiariaMinutos: 480,
};

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
      setForm(dados);
    } else {
      setForm(VALOR_INICIAL);
    }
    setErroValidacao(null);
  }, [jornadaEmEdicao]);

  function atualizar<K extends keyof DadosJornada>(campo: K, valor: DadosJornada[K]) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErroValidacao(null);

    // Validação de sanidade: os horários precisam estar em ordem cronológica.
    // Não impede jornadas noturnas/incomuns no banco, só evita erro de digitação óbvio.
    const entrada = horarioParaMinutosLocal(form.entrada);
    const saidaAlmoco = horarioParaMinutosLocal(form.saidaAlmoco);
    const retornoAlmoco = horarioParaMinutosLocal(form.retornoAlmoco);
    const saida = horarioParaMinutosLocal(form.saida);

    if (!(entrada < saidaAlmoco && saidaAlmoco < retornoAlmoco && retornoAlmoco < saida)) {
      setErroValidacao(
        "Os horários precisam estar em ordem: entrada < saída para almoço < retorno < saída."
      );
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
        required
        value={form.saidaAlmoco}
        onChange={(e) => atualizar("saidaAlmoco", e.target.value)}
      />
      <Input
        label="Retorno do almoço"
        type="time"
        required
        value={form.retornoAlmoco}
        onChange={(e) => atualizar("retornoAlmoco", e.target.value)}
      />
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
