import type { Timestamp } from "firebase/firestore";

export type AcaoAuditoria = "cadastro_funcionario" | "correcao_ponto" | "desativacao_usuario";

export interface RegistroAuditoria {
  id: string;
  acao: AcaoAuditoria;
  administradorId: string;
  alvoId: string;
  detalhes: Record<string, unknown>;
  criadoEm: Timestamp | string | null;
  administradorNome?: string;
  alvoNome?: string;
  usuarioNome?: string;
}