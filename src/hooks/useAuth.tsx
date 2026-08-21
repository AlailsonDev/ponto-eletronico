"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import { observarSessao, buscarPerfilUsuario } from "@/services/auth.service";
import type { Usuario } from "@/types/usuario";

interface AuthContextValue {
  firebaseUser: User | null;
  perfil: Usuario | null;
  carregando: boolean;
  // true quando existe sessão no Firebase Auth mas o perfil em usuarios/{uid}
  // não foi encontrado ou está inativo — usado para barrar acesso mesmo
  // com token válido.
  sessaoInvalida: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [sessaoInvalida, setSessaoInvalida] = useState(false);

  useEffect(() => {
    const unsubscribe = observarSessao(async (user) => {
      setFirebaseUser(user);

      if (!user) {
        setPerfil(null);
        setSessaoInvalida(false);
        setCarregando(false);
        return;
      }

      try {
        const perfilUsuario = await buscarPerfilUsuario(user.uid);

        if (!perfilUsuario || perfilUsuario.status !== "ativo") {
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

  return (
    <AuthContext.Provider value={{ firebaseUser, perfil, carregando, sessaoInvalida }}>
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
