"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Database,
  Glasses,
  PackageSearch,
  Plus,
  RefreshCw,
  UserPlus,
  UsersRound,
  WifiOff,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { DEMO_MODE } from "@/services/config";
import { obterDashboard } from "@/services/dashboard";
import type { DashboardResumo } from "@/types/dashboard";
import { statusLabels, type StatusPedido } from "@/types/pedido";

const statusTone: Record<StatusPedido, string> = {
  RECEBIDO: "bg-sky-50 text-sky-700",
  EM_PRODUCAO: "bg-amber-50 text-amber-700",
  PRONTO: "bg-emerald-50 text-emerald-700",
  ENTREGUE: "bg-indigo-50 text-indigo-700",
  CANCELADO: "bg-rose-50 text-rose-700",
};

export function Dashboard() {
  const [summary, setSummary] = useState<DashboardResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try { setSummary(await obterDashboard()); }
    catch { setError(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let active = true;
    obterDashboard()
      .then((result) => {
        if (!active) return;
        setSummary(result);
        setError(false);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError(true);
        setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const cards = [
    { label: "Total de clientes", value: summary?.totalClientes, icon: UsersRound, tone: "bg-teal-50 text-teal-700" },
    { label: "Total de OS", value: summary?.totalPedidos, icon: ClipboardList, tone: "bg-indigo-50 text-indigo-700" },
    { label: "OS em produção", value: summary?.pedidosEmProducao, icon: Clock3, tone: "bg-amber-50 text-amber-700" },
    { label: "OS prontas", value: summary?.pedidosProntos, icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Produtos ativos", value: summary?.produtosCadastrados, icon: Boxes, tone: "bg-sky-50 text-sky-700" },
  ];

  return <div className="mx-auto w-full max-w-[1480px] space-y-6">
    <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-sm font-medium text-teal-700">Painel operacional</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-[28px]">Bom trabalho hoje.</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Acompanhe o laboratório da entrada da OS até a entrega.</p>
      </div>
      <div className={`flex w-fit items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${error ? "border-rose-200 bg-rose-50 text-rose-700" : DEMO_MODE ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
        <span className={`size-2 rounded-full ${error ? "bg-rose-500" : DEMO_MODE ? "bg-amber-500" : "bg-emerald-500"}`} />
        {error ? "API indisponível" : DEMO_MODE ? "Modo demonstração" : "API conectada"}
      </div>
    </section>

    {DEMO_MODE && !error && <section className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-950"><Database className="mt-0.5 size-5 shrink-0 text-amber-700" /><p className="leading-5"><strong>Ambiente de teste.</strong> Clientes, produtos, estoque e ordens de serviço ficam salvos neste navegador.</p></section>}
    {error && <section className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-900 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><WifiOff className="size-5 shrink-0" /><p>Não foi possível carregar os indicadores. Confirme a conexão com o backend.</p></div><button onClick={() => void load()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 font-semibold"><RefreshCw className="size-4" /> Tentar novamente</button></section>}

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map(({ label, value, icon: Icon, tone }) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><span className={`grid size-10 place-items-center rounded-xl ${tone}`}><Icon className="size-5" /></span>{label === "Produtos ativos" && summary && summary.produtosEstoqueBaixo > 0 && <Link href="/estoque" className="rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase text-amber-700">{summary.produtosEstoqueBaixo} baixos</Link>}</div><p className="mt-5 text-sm font-medium text-slate-500">{label}</p>{loading ? <div className="mt-2 h-9 w-14 animate-pulse rounded-lg bg-slate-100" /> : <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">{value ?? "—"}</p>}</article>)}
    </section>

    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.75fr)]">
      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div><h3 className="font-semibold text-slate-900">Ordens de serviço recentes</h3><p className="mt-1 text-xs text-slate-500">Últimas entradas e movimentações do laboratório</p></div>
          <Link href="/pedidos" className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700">Ver todas <ArrowRight className="size-3.5" /></Link>
        </header>
        {loading ? <div className="space-y-px">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 animate-pulse border-b border-slate-100 bg-slate-50" />)}</div> : summary?.pedidosRecentes.length ? <div>{summary.pedidosRecentes.map((pedido) => <Link key={pedido.id} href="/pedidos" className="grid gap-2 border-b border-slate-100 px-5 py-4 last:border-0 hover:bg-slate-50 sm:grid-cols-[110px_minmax(180px,1fr)_130px_120px] sm:items-center sm:px-6"><span className="text-sm font-bold text-slate-800">OS-{String(pedido.id).padStart(6, "0")}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{pedido.cliente.nome}</p><p className="mt-0.5 text-xs text-slate-500">{formatDate(pedido.dataPedido)} · {pedido.itens.length ? `${pedido.itens.length} item(ns)` : "OS técnica"}</p></div><span className={`w-fit rounded-lg px-2.5 py-1 text-xs font-semibold ${statusTone[pedido.status]}`}>{statusLabels[pedido.status]}</span><span className="text-sm font-semibold text-slate-800 sm:text-right">{formatCurrency(pedido.valorTotal)}</span></Link>)}</div> : <div className="grid min-h-72 place-items-center text-center"><div><PackageSearch className="mx-auto size-9 text-slate-300" /><h4 className="mt-3 font-semibold text-slate-800">Nenhuma OS registrada</h4><Link href="/pedidos/nova-os" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white"><Plus className="size-4" /> Registrar nova OS</Link></div></div>}
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-teal-700">Acesso rápido</p>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">Rotinas principais</h3>
        <div className="mt-5 space-y-3"><Quick href="/pedidos/nova-os" icon={ClipboardList} label="Registrar nova OS" primary /><Quick href="/pedidos" icon={Clock3} label="Acompanhar produção" /><Quick href="/clientes?novo=1" icon={UserPlus} label="Cadastrar novo cliente" /><Quick href="/produtos" icon={Glasses} label="Gerenciar produtos" /><Quick href="/estoque" icon={Boxes} label="Conferir estoque" /></div>
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Sistema de OS</p><p className="mt-2 text-sm leading-5 text-emerald-900">Receita óptica, produção, clientes e estoque já trabalham de forma integrada.</p></div>
      </article>
    </section>
  </div>;
}

function Quick({ href, icon: Icon, label, primary = false }: { href: string; icon: typeof ClipboardList; label: string; primary?: boolean }) {
  return <Link href={href} className={`group flex min-h-13 items-center gap-3 rounded-xl px-4 text-sm font-semibold ${primary ? "bg-teal-700 text-white hover:bg-teal-800" : "border border-slate-200 text-slate-700 hover:border-teal-200 hover:bg-teal-50"}`}><Icon className="size-4" />{label}<ArrowRight className="ml-auto size-4 transition-transform group-hover:translate-x-0.5" /></Link>;
}
