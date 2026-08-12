"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Boxes, Check, LoaderCircle, PackageCheck, PackageX, Pencil, Search, X } from "lucide-react";
import { DemoBanner } from "@/components/ui/demo-banner";
import { Modal } from "@/components/ui/modal";
import { DEMO_MODE } from "@/services/config";
import { atualizarEstoque, listarProdutos, resetarProdutosDemo } from "@/services/produtos";
import { categoriaLabels, type Produto } from "@/types/produto";

export function EstoquePage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [onlyLow, setOnlyLow] = useState(false);
  const [editing, setEditing] = useState<Produto | null>(null);
  const [quantity, setQuantity] = useState(0);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setProdutos((await listarProdutos({ size: 100, sort: "nome,asc" })).content); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível carregar o estoque."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let active = true;
    listarProdutos({ size: 100, sort: "nome,asc" }).then((response) => {
      if (!active) return;
      setProdutos(response.content);
      setError(null);
      setLoading(false);
    }).catch((caught: unknown) => {
      if (!active) return;
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar o estoque.");
      setLoading(false);
    });
    return () => { active = false; };
  }, []);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 3000); return () => window.clearTimeout(timer); }, [toast]);

  const filtered = useMemo(() => produtos.filter((produto) => produto.nome.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))).filter((produto) => !onlyLow || produto.quantidadeEstoque <= 5), [onlyLow, produtos, search]);
  const active = produtos.filter((produto) => produto.ativo);
  const totalUnits = active.reduce((sum, produto) => sum + produto.quantidadeEstoque, 0);
  const low = active.filter((produto) => produto.quantidadeEstoque > 0 && produto.quantidadeEstoque <= 5).length;
  const out = active.filter((produto) => produto.quantidadeEstoque === 0).length;

  async function submit(event: FormEvent) {
    event.preventDefault(); if (!editing || quantity < 0 || !Number.isInteger(quantity)) return;
    setSaving(true);
    try { await atualizarEstoque(editing.id, quantity); setEditing(null); setToast("Estoque atualizado com sucesso."); await load(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível atualizar o estoque."); }
    finally { setSaving(false); }
  }

  async function resetDemo() {
    setResetting(true);
    try { await resetarProdutosDemo(); await load(); setToast("Estoque de demonstração restaurado."); }
    finally { setResetting(false); }
  }

  return <div className="mx-auto w-full max-w-[1480px] space-y-6">
    {toast && <div className="fixed right-4 top-24 z-[80] flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-800 shadow-xl"><Check className="size-4" />{toast}<button onClick={() => setToast(null)}><X className="size-4 text-slate-400" /></button></div>}
    <section><p className="text-sm font-medium text-teal-700">Controle operacional</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-[28px]">Estoque</h2><p className="mt-2 text-sm leading-6 text-slate-500">Acompanhe saldos e identifique rapidamente itens que precisam de reposição.</p></section>
    {DEMO_MODE && <DemoBanner description="ajuste quantidades e simule a reposição dos produtos." onReset={() => void resetDemo()} resetting={resetting} />}
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={Boxes} label="Unidades em estoque" value={totalUnits} tone="teal" /><Metric icon={PackageCheck} label="Produtos ativos" value={active.length} tone="blue" /><Metric icon={AlertTriangle} label="Estoque baixo" value={low} tone="amber" /><Metric icon={PackageX} label="Sem estoque" value={out} tone="red" /></section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><label className="relative w-full max-w-lg"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm focus:border-teal-500" placeholder="Pesquisar produto no estoque" /></label><label className="flex items-center gap-2 text-sm font-semibold text-slate-600"><input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} className="size-4 accent-teal-700" /> Apenas estoque baixo</label></div>
      {error ? <div className="grid min-h-72 place-items-center p-6 text-center text-sm text-rose-700">{error}</div> : loading ? <div className="space-y-px">{Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-16 animate-pulse border-b border-slate-100 bg-slate-50/70" />)}</div> : filtered.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead><tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500"><th className="px-5 py-3.5">Produto</th><th className="px-4 py-3.5">Categoria</th><th className="px-4 py-3.5">Quantidade</th><th className="px-4 py-3.5">Situação</th><th className="px-5 py-3.5 text-right">Ajuste</th></tr></thead><tbody>{filtered.map((produto) => <tr key={produto.id} className="border-b border-slate-100 last:border-0"><td className="px-5 py-4"><p className="text-sm font-semibold text-slate-900">{produto.nome}</p><p className="mt-0.5 text-xs text-slate-500">{produto.marca || "Sem marca"}</p></td><td className="px-4 py-4 text-sm text-slate-600">{categoriaLabels[produto.categoria]}</td><td className="px-4 py-4 text-sm font-bold text-slate-900">{produto.quantidadeEstoque} un.</td><td className="px-4 py-4"><Status quantity={produto.quantidadeEstoque} /></td><td className="px-5 py-4 text-right"><button onClick={() => { setEditing(produto); setQuantity(produto.quantidadeEstoque); }} className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:border-teal-200 hover:bg-teal-50"><Pencil className="size-3.5" /> Ajustar</button></td></tr>)}</tbody></table></div> : <div className="grid min-h-72 place-items-center text-center"><div><Boxes className="mx-auto size-8 text-slate-300" /><h3 className="mt-3 font-semibold text-slate-900">Nenhum item encontrado</h3></div></div>}
    </section>
    <Modal open={editing !== null} title="Ajustar estoque" description={editing?.nome} onClose={() => !saving && setEditing(null)} closeDisabled={saving} size="sm"><form onSubmit={submit}><div className="px-5 py-6"><label className="text-sm font-semibold text-slate-700">Nova quantidade<input autoFocus type="number" min="0" step="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-lg font-semibold focus:border-teal-500" /></label><p className="mt-2 text-xs text-slate-500">Informe o saldo físico atual do produto.</p></div><div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end"><button type="button" onClick={() => setEditing(null)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold">Cancelar</button><button disabled={saving || quantity < 0 || !Number.isInteger(quantity)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white disabled:opacity-50">{saving ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />} Salvar quantidade</button></div></form></Modal>
  </div>;
}

function Metric({ icon: Icon, label, value, tone }: { icon: typeof Boxes; label: string; value: number; tone: "teal" | "blue" | "amber" | "red" }) { const tones = { teal: "bg-teal-50 text-teal-700", blue: "bg-sky-50 text-sky-700", amber: "bg-amber-50 text-amber-700", red: "bg-rose-50 text-rose-700" }; return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className={`grid size-10 place-items-center rounded-xl ${tones[tone]}`}><Icon className="size-5" /></span><p className="mt-4 text-sm font-medium text-slate-500">{label}</p><p className="mt-1 text-3xl font-semibold text-slate-950">{value}</p></article>; }
function Status({ quantity }: { quantity: number }) { if (quantity === 0) return <span className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">Sem estoque</span>; if (quantity <= 5) return <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Estoque baixo</span>; return <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Disponível</span>; }
