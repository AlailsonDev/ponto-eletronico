"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import clsx from "clsx";
import { LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { logout } from "@/services/auth.service";
import { useAuth } from "@/hooks/useAuth";
import type { Usuario } from "@/types/usuario";

// Todo perfil bate ponto próprio, então "Ponto" e "Histórico" aparecem para
// todo mundo. Admin ganha "Funcionários" também. Gestor ganhará "Setor"
// quando essa área for implementada.
const LINKS_BASE = [
  { href: "/dashboard", rotulo: "Ponto" },
  { href: "/historico", rotulo: "Histórico" },
];

const LINKS_ADMIN = [
  { href: "/admin/dashboard", rotulo: "Painel" },
  { href: "/admin/relatorios", rotulo: "Relatórios" },
  { href: "/admin/correcoes", rotulo: "Correções" },
  { href: "/admin/auditoria", rotulo: "Auditoria" },
  ...LINKS_BASE,
  { href: "/admin/funcionarios", rotulo: "Funcionários" },
  { href: "/admin/setores", rotulo: "Setores" },
  { href: "/admin/jornadas", rotulo: "Jornadas" },
];

export function AppHeader({ usuario }: { usuario: Usuario }) {
  const router = useRouter();
  const pathname = usePathname();
  const { firebaseUser } = useAuth();
  const [saindo, setSaindo] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const [solicitacoesPendentes, setSolicitacoesPendentes] = useState(0);

  const links = usuario.perfil === "admin" ? LINKS_ADMIN : LINKS_BASE;

  useEffect(() => {
    if (usuario.perfil !== "admin" || !firebaseUser) {
      setSolicitacoesPendentes(0);
      return;
    }

    const usuarioAutenticado = firebaseUser;
    let ativo = true;
    async function carregarSolicitacoesPendentes() {
      try {
        const token = await usuarioAutenticado.getIdToken();
        const resposta = await fetch("/api/correcoes", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resposta.ok) return;
        const solicitacoes = (await resposta.json()) as unknown[];
        if (ativo) setSolicitacoesPendentes(solicitacoes.length);
      } catch {
        // O contador não deve impedir a navegação do cabeçalho.
      }
    }

    carregarSolicitacoesPendentes();
    return () => { ativo = false; };
  }, [firebaseUser, pathname, usuario.perfil]);

  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

  async function handleLogout() {
    setSaindo(true);
    await logout();
    router.replace("/login");
  }

  return (
    <header className="relative flex items-center justify-between border-b border-surface-border bg-white px-4 py-4 sm:px-6">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-navy-800" />
          <span className="font-display text-sm font-semibold text-navy-800">
            Ponto Eletrônico
          </span>
        </div>

        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "relative rounded-card px-3 py-1.5 font-body text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-navy-800 text-white"
                  : "text-ink-600 hover:bg-surface"
              )}
            >
              {link.rotulo}
              {link.href === "/admin/correcoes" && solicitacoesPendentes > 0 && (
                <span
                  aria-label={`${solicitacoesPendentes} solicitações pendentes`}
                  className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 font-body text-[10px] font-bold leading-none text-white"
                >
                  {solicitacoesPendentes}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden text-right sm:block">
          <p className="font-body text-sm font-medium text-ink-900">{usuario.nome}</p>
          <p className="font-body text-xs text-ink-400">{usuario.cargo}</p>
        </div>
        <button
          type="button"
          onClick={() => setMenuAberto((aberto) => !aberto)}
          aria-expanded={menuAberto}
          aria-controls="menu-navegacao-mobile"
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
          className="flex h-9 w-9 items-center justify-center rounded-card text-ink-600 transition-colors hover:bg-surface sm:hidden"
        >
          {menuAberto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <button
          type="button"
          onClick={handleLogout}
          disabled={saindo}
          aria-label="Sair"
          className="flex h-9 w-9 items-center justify-center rounded-card text-ink-400 transition-colors hover:bg-surface hover:text-red-600 disabled:opacity-60"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      {menuAberto && (
        <nav
          id="menu-navegacao-mobile"
          className="absolute inset-x-0 top-full z-10 border-b border-surface-border bg-white p-3 shadow-sm sm:hidden"
        >
          <div className="mb-3 border-b border-surface-border px-3 pb-3">
            <p className="font-body text-sm font-medium text-ink-900">{usuario.nome}</p>
            <p className="font-body text-xs text-ink-400">{usuario.cargo}</p>
          </div>
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuAberto(false)}
                className={clsx(
                  "relative rounded-card px-3 py-2.5 font-body text-sm font-medium",
                  pathname === link.href
                    ? "bg-navy-800 text-white"
                    : "text-ink-600 hover:bg-surface"
                )}
              >
                {link.rotulo}
                {link.href === "/admin/correcoes" && solicitacoesPendentes > 0 && (
                  <span
                    aria-label={`${solicitacoesPendentes} solicitações pendentes`}
                    className="absolute right-2 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 font-body text-[10px] font-bold leading-none text-white"
                  >
                    {solicitacoesPendentes}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
