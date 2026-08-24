"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import type { Perfil } from "@/types/usuario";

interface ProtectedRouteProps {
  children: ReactNode;
  perfisPermitidos?: Perfil[]; // se omitido, qualquer perfil autenticado passa
}

export function ProtectedRoute({ children, perfisPermitidos }: ProtectedRouteProps) {
  const { firebaseUser, perfil, carregando, sessaoInvalida, emailVerificado } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (carregando) return;

    if (!firebaseUser || sessaoInvalida || !perfil || !emailVerificado) {
      router.replace("/login");
      return;
    }

    if (perfisPermitidos && !perfisPermitidos.includes(perfil.perfil)) {
      // Usuário autenticado mas sem permissão para esta área específica —
      // manda de volta para a home do perfil dele, não para o login.
      router.replace(rotaPadraoPorPerfil(perfil.perfil));
    }
  }, [carregando, firebaseUser, perfil, sessaoInvalida, emailVerificado, perfisPermitidos, router]);

  if (carregando || !firebaseUser || !perfil || !emailVerificado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="font-body text-sm text-ink-400">Carregando…</p>
      </div>
    );
  }

  if (perfisPermitidos && !perfisPermitidos.includes(perfil.perfil)) {
    return null;
  }

  return <>{children}</>;
}

export function rotaPadraoPorPerfil(perfil: Perfil): string {
  switch (perfil) {
    case "admin":
      return "/admin/dashboard";
    case "gestor":
      return "/dashboard";
    case "funcionario":
    default:
      return "/dashboard";
  }
}
