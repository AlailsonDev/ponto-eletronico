"use client";

import { useState, type FormEvent } from "react";
import { RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { gerarSenhaProvisoria } from "@/lib/senhaProvisoria";
import type { Setor } from "@/types/setor";
import type { Jornada } from "@/types/jornada";
import type { NovoUsuarioInput, Perfil } from "@/types/usuario";

interface FormularioFuncionarioProps {
  setores: Setor[];
  jornadas: Jornada[];
  enviando: boolean;
  onSubmit: (input: NovoUsuarioInput) => void;
}

const VALOR_INICIAL: NovoUsuarioInput = {
  nome: "",
  matricula: "",
  email: "",
  cargo: "",
  setorId: "",
  perfil: "funcionario",
  jornadaId: "",
  dataAdmissao: new Date().toISOString().slice(0, 10),
  senhaProvisoria: "",
};

export function FormularioFuncionario({
  setores,
  jornadas,
  enviando,
  onSubmit,
}: FormularioFuncionarioProps) {
  const [form, setForm] = useState<NovoUsuarioInput>(VALOR_INICIAL);
  const [mostrarSenha, setMostrarSenha] = useState(true);

  function atualizar<K extends keyof NovoUsuarioInput>(campo: K, valor: NovoUsuarioInput[K]) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit(form);
    setForm({ ...VALOR_INICIAL, senhaProvisoria: "" }); // limpa o form após enviar
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
      <Input
        label="Nome completo"
        required
        value={form.nome}
        onChange={(e) => atualizar("nome", e.target.value)}
      />
      <Input
        label="Matrícula"
        required
        value={form.matricula}
        onChange={(e) => atualizar("matricula", e.target.value)}
      />
      <Input
        label="E-mail"
        type="email"
        required
        value={form.email}
        onChange={(e) => atualizar("email", e.target.value)}
        placeholder="nome.sobrenome@jaboatao.pe.gov.br"
      />
      <Input
        label="Cargo"
        required
        value={form.cargo}
        onChange={(e) => atualizar("cargo", e.target.value)}
      />

      <Select
        label="Setor"
        required
        value={form.setorId}
        onChange={(e) => atualizar("setorId", e.target.value)}
      >
        <option value="">Selecione…</option>
        {setores.map((setor) => (
          <option key={setor.id} value={setor.id}>
            {setor.nome}
          </option>
        ))}
      </Select>

      <Select
        label="Jornada"
        required
        value={form.jornadaId}
        onChange={(e) => atualizar("jornadaId", e.target.value)}
      >
        <option value="">Selecione…</option>
        {jornadas.map((jornada) => (
          <option key={jornada.id} value={jornada.id}>
            {jornada.nome}
          </option>
        ))}
      </Select>

      <Select
        label="Perfil"
        required
        value={form.perfil}
        onChange={(e) => atualizar("perfil", e.target.value as Perfil)}
      >
        <option value="funcionario">Funcionário</option>
        <option value="gestor">Gestor</option>
        <option value="admin">Administrador</option>
      </Select>

      <Input
        label="Data de admissão"
        type="date"
        required
        value={form.dataAdmissao}
        onChange={(e) => atualizar("dataAdmissao", e.target.value)}
      />

      <div className="sm:col-span-2">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              label="Senha provisória"
              type={mostrarSenha ? "text" : "password"}
              required
              minLength={6}
              value={form.senhaProvisoria}
              onChange={(e) => atualizar("senhaProvisoria", e.target.value)}
              placeholder="Gere ou digite uma senha"
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              atualizar("senhaProvisoria", gerarSenhaProvisoria());
              setMostrarSenha(true);
            }}
            className="mb-[1px]"
          >
            <RefreshCw className="h-4 w-4" />
            Gerar
          </Button>
        </div>
        <p className="mt-1.5 font-body text-xs text-ink-400">
          Repasse esta senha ao funcionário por um canal seguro — ela não fica salva em
          nenhum lugar além da criação da conta. Ele pode trocá-la depois via
          &quot;Esqueci minha senha&quot;.
        </p>
      </div>

      <div className="sm:col-span-2">
        <Button type="submit" carregando={enviando} className="w-full sm:w-auto">
          {enviando ? "Cadastrando…" : "Cadastrar funcionário"}
        </Button>
      </div>
    </form>
  );
}
