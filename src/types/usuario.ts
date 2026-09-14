import type { Timestamp } from "firebase/firestore";
import type { InsigniaRegularidade } from "@/types/retrospectiva";

export type Perfil = "funcionario" | "gestor" | "admin";
export type StatusUsuario = "ativo" | "inativo";

export interface Usuario {
  uid: string;
  nome: string;
  matricula: string;
  email: string;
  cpf?: string; // dado sensível — só exposto para admin, nunca em listas gerais
  cargo: string;
  setorId: string;
  perfil: Perfil;
  jornadaId: string;
  status: StatusUsuario;
  dataAdmissao: Timestamp;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
  insigniaAtual?: InsigniaRegularidade;
  insigniaPeriodo?: string;
  // true quando o funcionário trabalha no prédio da Ouvidoria — o registro de
  // ponto passa a validar a localização contra LOCAL_OUVIDORIA em vez do
  // local principal. Ausente (undefined) em documentos antigos == false.
  ouvidoria?: boolean;
}

// Formato usado no formulário de cadastro (antes de virar documento do Firestore)
export interface NovoUsuarioInput {
  nome: string;
  matricula: string;
  email: string;
  cpf?: string;
  cargo: string;
  setorId: string;
  perfil: Perfil;
  jornadaId: string;
  dataAdmissao: string; // ISO date do form
  senhaProvisoria: string;
  ouvidoria?: boolean;
}

export type EditarUsuarioInput = Omit<NovoUsuarioInput, "senhaProvisoria">;
