import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { AcaoAuditoria } from "@/types/auditoria";

export async function registrarAuditoria(input: {
  acao: AcaoAuditoria;
  administradorId: string;
  alvoId: string;
  detalhes?: Record<string, unknown>;
}) {
  await adminDb.collection("auditoria").add({
    acao: input.acao,
    administradorId: input.administradorId,
    alvoId: input.alvoId,
    detalhes: input.detalhes ?? {},
    criadoEm: FieldValue.serverTimestamp(),
  });
}