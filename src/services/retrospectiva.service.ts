import { auth } from "@/lib/firebase/config";
import type { Retrospectiva } from "@/types/retrospectiva";

export async function buscarRetrospectiva(periodo?: string): Promise<{ retrospectiva: Retrospectiva | null; deveExibir: boolean }> {
  const user = auth.currentUser;
  if (!user) return { retrospectiva: null, deveExibir: false };
  const query = periodo ? `?periodo=${encodeURIComponent(periodo)}` : "";
  const resposta = await fetch(`/api/retrospectiva${query}`, { headers: { Authorization: `Bearer ${await user.getIdToken()}` } });
  if (!resposta.ok) throw new Error("RETROSPECTIVA_INDISPONIVEL");
  return resposta.json();
}

export async function registrarVisualizacaoRetrospectiva(periodo: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  await fetch("/api/retrospectiva", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` }, body: JSON.stringify({ periodo }) });
}