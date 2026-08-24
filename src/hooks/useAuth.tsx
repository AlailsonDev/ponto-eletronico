"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import { observarSessao, buscarPerfilUsuario, logout } from "@/services/auth.service";
import type { Usuario } from "@/types/usuario";

const TEMPO_INATIVIDADE_MS = 5 * 60 * 1000;

interface AuthContextValue {
  firebaseUser: User | null;
  perfil: Usuario | null;
  carregando: boolean;
  // true quando existe sessão no Firebase Auth mas o perfil em usuarios/{uid}
  // não foi encontrado ou está inativo — usado para barrar acesso mesmo
  // com token válido.
  sessaoInvalida: boolean;
  emailVerificado: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [sessaoInvalida, setSessaoInvalida] = useState(false);
  const [emailVerificado, setEmailVerificado] = useState(false);

  useEffect(() => {
    const unsubscribe = observarSessao(async (user) => {
      setFirebaseUser(user);
      setEmailVerificado(user?.emailVerified ?? false);

      if (!user) {
        setPerfil(null);
        setSessaoInvalida(false);
        setCarregando(false);
        return;
      }

      try {
        const perfilUsuario = await buscarPerfilUsuario(user.uid);

        if (!perfilUsuario || perfilUsuario.status !== "ativo" || !user.emailVerified) {
          setPerfil(null);
          setSessaoInvalida(true);
        } else {
          setPerfil(perfilUsuario);
          setSessaoInvalida(false);
        }
      } catch {
        setPerfil(null);
        setSessaoInvalida(true);
      } finally {
        setCarregando(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;

    let temporizador: ReturnType<typeof setTimeout>;

    const iniciarTemporizador = () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(() => {
        logout().catch(() => {});
      }, TEMPO_INATIVIDADE_MS);
    };

    const eventosDeAtividade = ["mousedown", "keydown", "touchstart", "scroll"];
    eventosDeAtividade.forEach((evento) => window.addEventListener(evento, iniciarTemporizador));
    iniciarTemporizador();

    return () => {
      clearTimeout(temporizador);
      eventosDeAtividade.forEach((evento) => window.removeEventListener(evento, iniciarTemporizador));
    };
  }, [firebaseUser]);

  return (
    <AuthContext.Provider value={{ firebaseUser, perfil, carregando, sessaoInvalida, emailVerificado }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth precisa ser usado dentro de um AuthProvider.");
  }
  return context;
}
