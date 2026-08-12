"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Boxes,
  CircleGauge,
  FlaskConical,
  Glasses,
  LogOut,
  Menu,
  ShoppingBag,
  UsersRound,
  X,
} from "lucide-react";

interface AdminShellProps {
  children: React.ReactNode;
  userName: string;
}

const navigation = [
  { label: "Dashboard", href: "/", icon: CircleGauge, available: true },
  { label: "Clientes", href: "/clientes", icon: UsersRound, available: true },
  { label: "Pedidos", href: "/pedidos", icon: ShoppingBag, available: true },
  { label: "Produtos", href: "/produtos", icon: Glasses, available: true },
  { label: "Estoque", href: "/estoque", icon: Boxes, available: true },
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function pageTitle(pathname: string) {
  if (pathname.startsWith("/clientes")) return "Clientes";
  if (pathname.startsWith("/produtos")) return "Produtos";
  if (pathname.startsWith("/estoque")) return "Estoque";
  if (pathname.startsWith("/pedidos")) return "Pedidos";
  return "Visão geral";
}

export function AdminShell({ children, userName }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [mobileOpen]);

  const sidebar = (
    <div className="flex h-full flex-col bg-[var(--sidebar)] text-white">
      <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-teal-400 text-slate-950 shadow-lg shadow-teal-950/20">
          <FlaskConical className="size-5" strokeWidth={2.3} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold tracking-tight">Sistema Óptica</p>
          <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.16em] text-teal-100/60">
            Gestão integrada
          </p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6" aria-label="Navegação principal">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          Operação
        </p>
        <ul className="space-y-1.5">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                {item.available ? (
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                      active
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-300 hover:bg-white/7 hover:text-white"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon
                      className={`size-[18px] ${active ? "text-teal-700" : "text-slate-400 group-hover:text-teal-300"}`}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <div
                    className="flex min-h-11 cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500"
                    aria-label={`${item.label}, disponível em uma próxima fase`}
                  >
                    <Icon className="size-[18px]" strokeWidth={2} aria-hidden="true" />
                    <span>{item.label}</span>
                    <span className="ml-auto rounded-md border border-white/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                      Breve
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-2xl bg-[var(--sidebar-deep)] p-3">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-400/15 text-xs font-bold text-teal-200">
              {initials(userName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{userName}</p>
              <p className="mt-0.5 text-[10px] text-slate-500">Administrador</p>
            </div>
            <LogOut className="size-4 text-slate-600" aria-hidden="true" />
          </div>
          <p className="mt-2 border-t border-white/6 pt-2 text-[10px] leading-4 text-slate-600">
            Logout será habilitado com a autenticação.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        {sidebar}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
          />
          <aside className="relative h-full w-[min(84vw,19rem)] shadow-2xl">
            {sidebar}
            <button
              type="button"
              className="absolute right-3 top-5 grid size-9 place-items-center rounded-xl text-slate-300 hover:bg-white/10 hover:text-white"
              onClick={() => setMobileOpen(false)}
              aria-label="Fechar menu de navegação"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 h-20 border-b border-slate-200/80 bg-white/92 backdrop-blur-xl">
          <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Abrir menu de navegação"
              >
                <Menu className="size-5" aria-hidden="true" />
              </button>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-700">
                  Sistema Óptica
                </p>
                <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900">
                  {pageTitle(pathname)}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="max-w-48 truncate text-sm font-semibold text-slate-800">
                  {userName}
                </p>
                <p className="text-xs text-slate-500">Administrador</p>
              </div>
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-900 text-xs font-bold text-white shadow-sm">
                {initials(userName)}
              </span>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-5rem)] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
