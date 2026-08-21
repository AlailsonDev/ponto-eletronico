"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { rotaPadraoPorPerfil } from "@/components/layout/ProtectedRoute";

export default function RootPage() {
  const router = useRouter();
  const { firebaseUser, perfil, carregando, sessaoInvalida } = useAuth();

  useEffect(() => {
    if (carregando) return;

    if (!firebaseUser || sessaoInvalida || !perfil) {
      router.replace("/login");
      return;
    }

    router.replace(rotaPadraoPorPerfil(perfil.perfil));
  }, [carregando, firebaseUser, perfil, sessaoInvalida, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <p className="font-body text-sm text-ink-400">Carregando…</p>
    </div>
  );
}
