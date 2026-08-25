"use client";

import { useEffect, useState, type FormEvent } from "react";
import { RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { gerarSenhaProvisoria } from "@/lib/senhaProvisoria";
import type { Setor } from "@/types/setor";
import type { Jornada } from "@/types/jornada";
import type { NovoUsuarioInput, Perfil, Usuario } from "@/types/usuario";

interface FormularioFuncionarioProps {
  setores: Setor[];
  jornadas: Jornada[];
  enviando: boolean;
  onSubmit: (input: NovoUsuarioInput) => void;
  funcionario?: Usuario | null;
  onCancelarEdicao?: () => void;
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

function formatarDataAdmissao(valor: unknown): string {
  if (!valor) return "";

  const data =
    typeof valor === "object" && "toDate" in valor && typeof valor.toDate === "function"
      ? valor.toDate()
      : valor instanceof Date
        ? valor
        : new Date(valor as string | number);

  return Number.isNaN(data.getTime()) ? "" : data.toISOString().slice(0, 10);
}

export function FormularioFuncionario({
  setores,
  jornadas,
  enviando,
  onSubmit,
  funcionario = null,
  onCancelarEdicao,
}: FormularioFuncionarioProps) {
  const [form, setForm] = useState<NovoUsuarioInput>(VALOR_INICIAL);
  const [mostrarSenha, setMostrarSenha] = useState(true);
  const editando = !!funcionario;

  useEffect(() => {
    if (!funcionario) {
      setForm(VALOR_INICIAL);
      return;
    }
    setForm({
      nome: funcionario.nome,
      matricula: funcionario.matricula,
      email: funcionario.email,
      cargo: funcionario.cargo,
      setorId: funcionario.setorId,
      perfil: funcionario.perfil,
      jornadaId: funcionario.jornadaId,
      dataAdmissao: formatarDataAdmissao(funcionario.dataAdmissao),
      senhaProvisoria: "",
    });
  }, [funcionario]);

  function atualizar<K extends keyof NovoUsuarioInput>(campo: K, valor: NovoUsuarioInput[K]) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit(form);
    if (!editando) setForm({ ...VALOR_INICIAL, senhaProvisoria: "" });
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
              required={!editando}
              minLength={editando ? undefined : 6}
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
          {editando ? "Deixe em branco para manter a senha atual." : "Repasse esta senha ao funcionário por um canal seguro — ela não fica salva em nenhum lugar além da criação da conta. Ele pode trocá-la depois via \"Esqueci minha senha\"."}
        </p>
      </div>

      <div className="sm:col-span-2">
        <Button type="submit" carregando={enviando} className="w-full sm:w-auto">
          {enviando ? (editando ? "Salvando…" : "Cadastrando…") : (editando ? "Salvar alterações" : "Cadastrar funcionário")}
        </Button>
        {editando && onCancelarEdicao && (
          <Button type="button" variant="secondary" onClick={onCancelarEdicao} className="ml-2">
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
