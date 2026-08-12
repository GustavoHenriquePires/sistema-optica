"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Ban,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
  Clock3,
  Eye,
  LoaderCircle,
  PackageCheck,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { DemoBanner } from "@/components/ui/demo-banner";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { ApiClientError } from "@/services/api";
import { listarClientes } from "@/services/clientes";
import { DEMO_MODE } from "@/services/config";
import { atualizarStatusPedido, buscarPedido, criarPedido, excluirPedido, listarPedidos, resetarPedidosDemo } from "@/services/pedidos";
import { listarProdutos } from "@/services/produtos";
import type { PaginaResponse } from "@/types/api";
import type { Cliente } from "@/types/cliente";
import { nextStatus, statusLabels, type Pedido, type PedidoRequest, type StatusPedido } from "@/types/pedido";
import type { Produto } from "@/types/produto";

type DraftItem = { produtoId: number; quantidade: number };

const statusTone: Record<StatusPedido, string> = {
  RECEBIDO: "bg-sky-50 text-sky-700 ring-sky-200",
  EM_PRODUCAO: "bg-amber-50 text-amber-700 ring-amber-200",
  PRONTO: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  ENTREGUE: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  CANCELADO: "bg-rose-50 text-rose-700 ring-rose-200",
};

const emptyRequest: PedidoRequest = { clienteId: 0, itens: [], dataPrevisao: null, observacoes: "" };

export function PedidosPage() {
  const [data, setData] = useState<PaginaResponse<Pedido> | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusPedido | "">("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<PedidoRequest>(emptyRequest);
  const [draftItem, setDraftItem] = useState<DraftItem>({ produtoId: 0, quantidade: 1 });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState<Pedido | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Pedido | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await listarPedidos({ cliente: search, status, page, size: 10 })); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível carregar os pedidos."); }
    finally { setLoading(false); }
  }, [page, search, status]);

  useEffect(() => {
    let active = true;
    listarPedidos({ cliente: search, status, page, size: 10 }).then((result) => { if (!active) return; setData(result); setError(null); setLoading(false); }).catch((caught: unknown) => { if (!active) return; setError(caught instanceof Error ? caught.message : "Não foi possível carregar os pedidos."); setLoading(false); });
    return () => { active = false; };
  }, [page, search, status]);

  useEffect(() => {
    let active = true;
    Promise.all([listarClientes({ page: 0, size: 100 }), listarProdutos({ page: 0, size: 100, ativo: true })]).then(([clientPage, productPage]) => { if (!active) return; setClientes(clientPage.content); setProdutos(productPage.content); }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 3500); return () => window.clearTimeout(timer); }, [toast]);

  const total = useMemo(() => form.itens.reduce((sum, item) => { const produto = produtos.find((p) => p.id === item.produtoId); return sum + (produto?.preco ?? 0) * item.quantidade; }, 0), [form.itens, produtos]);

  function openCreate() { setForm({ ...emptyRequest, itens: [] }); setDraftItem({ produtoId: produtos.find((item) => item.quantidadeEstoque > 0)?.id ?? 0, quantidade: 1 }); setFormError(null); setFormOpen(true); }

  function addItem() {
    const produto = produtos.find((item) => item.id === draftItem.produtoId);
    if (!produto) { setFormError("Selecione um produto."); return; }
    if (draftItem.quantidade <= 0 || !Number.isInteger(draftItem.quantidade)) { setFormError("A quantidade deve ser um número inteiro maior que zero."); return; }
    const current = form.itens.find((item) => item.produtoId === draftItem.produtoId)?.quantidade ?? 0;
    if (current + draftItem.quantidade > produto.quantidadeEstoque) { setFormError(`Estoque insuficiente. Disponível: ${produto.quantidadeEstoque} unidade(s).`); return; }
    setForm((value) => ({ ...value, itens: value.itens.some((item) => item.produtoId === draftItem.produtoId) ? value.itens.map((item) => item.produtoId === draftItem.produtoId ? { ...item, quantidade: item.quantidade + draftItem.quantidade } : item) : [...value.itens, draftItem] }));
    setDraftItem((value) => ({ ...value, quantidade: 1 })); setFormError(null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.clienteId) { setFormError("Selecione o cliente do pedido."); return; }
    if (!form.itens.length) { setFormError("Adicione pelo menos um produto ao pedido."); return; }
    setSaving(true); setFormError(null);
    try { const created = await criarPedido(form); setFormOpen(false); setToast(`Pedido #${created.id} criado com sucesso.`); setPage(0); await refreshReferences(); await load(); }
    catch (caught) { setFormError(caught instanceof ApiClientError ? caught.message : "Não foi possível criar o pedido."); }
    finally { setSaving(false); }
  }

  async function refreshReferences() {
    const [clientPage, productPage] = await Promise.all([
      listarClientes({ page: 0, size: 100 }),
      listarProdutos({ page: 0, size: 100, ativo: true }),
    ]);
    setClientes(clientPage.content);
    setProdutos(productPage.content);
  }

  async function view(id: number) { setViewLoading(true); try { setViewing(await buscarPedido(id)); } catch (caught) { setError(caught instanceof Error ? caught.message : "Pedido não encontrado."); } finally { setViewLoading(false); } }

  async function changeStatus(pedido: Pedido, next: StatusPedido) {
    setStatusLoading(true);
    try { const updated = await atualizarStatusPedido(pedido.id, next); setViewing(updated); setToast(`Pedido #${pedido.id}: ${statusLabels[next]}.`); await refreshReferences(); await load(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível atualizar o status."); }
    finally { setStatusLoading(false); }
  }

  async function remove() { if (!deleteTarget) return; setDeleting(true); try { await excluirPedido(deleteTarget.id); setDeleteTarget(null); setToast("Pedido excluído com sucesso."); await load(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível excluir o pedido."); } finally { setDeleting(false); } }

  async function resetDemo() { setResetting(true); try { await resetarPedidosDemo(); setSearchInput(""); setSearch(""); setStatus(""); setPage(0); await refreshReferences(); setData(await listarPedidos({ page: 0, size: 10 })); setToast("Pedidos de demonstração restaurados."); } finally { setResetting(false); } }

  return <div className="mx-auto w-full max-w-[1480px] space-y-6">
    {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-teal-700">Produção</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-[28px]">Pedidos</h2><p className="mt-2 text-sm leading-6 text-slate-500">Crie pedidos, acompanhe a produção e organize as entregas.</p></div><button onClick={openCreate} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"><Plus className="size-4" /> Novo pedido</button></section>
    {DEMO_MODE && <DemoBanner description="crie pedidos e percorra todo o fluxo de produção. O estoque será atualizado automaticamente." onReset={() => void resetDemo()} resetting={resetting} />}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-3 border-b border-slate-100 p-4 sm:p-5 lg:grid-cols-[minmax(280px,1fr)_200px]"><form onSubmit={(event) => { event.preventDefault(); setLoading(true); setPage(0); setSearch(searchInput.trim()); }} className="flex gap-2"><label className="relative flex-1"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm focus:border-teal-500" placeholder="Pesquisar por cliente" /></label><button className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700">Buscar</button></form><select value={status} onChange={(e) => { setLoading(true); setStatus(e.target.value as StatusPedido | ""); setPage(0); }} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"><option value="">Todos os status</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      {error ? <ErrorState message={error} retry={() => void load()} /> : loading ? <Rows /> : data?.content.length ? <><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left"><thead><tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500"><th className="px-5 py-3.5">Pedido</th><th className="px-4 py-3.5">Cliente</th><th className="px-4 py-3.5">Data</th><th className="px-4 py-3.5">Previsão</th><th className="px-4 py-3.5">Total</th><th className="px-4 py-3.5">Status</th><th className="px-5 py-3.5 text-right">Ações</th></tr></thead><tbody>{data.content.map((pedido) => <tr key={pedido.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"><td className="px-5 py-4 text-sm font-bold text-slate-900">#{String(pedido.id).padStart(4, "0")}</td><td className="px-4 py-4"><p className="text-sm font-semibold text-slate-900">{pedido.cliente.nome}</p><p className="mt-0.5 text-xs text-slate-500">{pedido.itens.length} item(ns)</p></td><td className="px-4 py-4 text-sm text-slate-600">{formatDate(pedido.dataPedido)}</td><td className="px-4 py-4 text-sm text-slate-600">{pedido.dataPrevisao ? formatDate(`${pedido.dataPrevisao}T12:00:00`) : "—"}</td><td className="px-4 py-4 text-sm font-semibold text-slate-800">{formatCurrency(pedido.valorTotal)}</td><td className="px-4 py-4"><StatusBadge status={pedido.status} /></td><td className="px-5 py-4"><div className="flex justify-end gap-1.5"><Action icon={Eye} label="Visualizar pedido" onClick={() => void view(pedido.id)} />{pedido.status === "CANCELADO" && <Action icon={Trash2} label="Excluir pedido" onClick={() => setDeleteTarget(pedido)} danger />}</div></td></tr>)}</tbody></table></div><div className="flex items-center justify-between border-t border-slate-100 px-5 py-4"><p className="text-xs text-slate-500">{data.totalElements} pedido(s)</p><div className="flex items-center gap-2"><button disabled={data.first} onClick={() => { setLoading(true); setPage(page - 1); }} className="grid size-9 place-items-center rounded-lg border border-slate-200 disabled:opacity-40"><ChevronLeft className="size-4" /></button><span className="text-sm font-semibold">{page + 1}</span><button disabled={data.last} onClick={() => { setLoading(true); setPage(page + 1); }} className="grid size-9 place-items-center rounded-lg border border-slate-200 disabled:opacity-40"><ChevronRight className="size-4" /></button></div></div></> : <Empty onCreate={openCreate} />}
    </section>

    <Modal open={formOpen} title="Novo pedido" description="Selecione o cliente, os produtos e a previsão de entrega." onClose={() => !saving && setFormOpen(false)} closeDisabled={saving} size="lg"><form onSubmit={submit} noValidate><div className="space-y-5 px-5 py-5 sm:px-6">{formError && <Alert message={formError} />}<label className="block text-sm font-semibold text-slate-700">Cliente <span className="text-rose-600">*</span><select autoFocus value={form.clienteId} onChange={(e) => setForm((value) => ({ ...value, clienteId: Number(e.target.value) }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value={0}>Selecione um cliente</option>{clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>)}</select></label><div className="rounded-2xl border border-slate-200 p-4"><p className="text-sm font-semibold text-slate-800">Adicionar produto</p><div className="mt-3 grid gap-2 sm:grid-cols-[1fr_100px_auto]"><select value={draftItem.produtoId} onChange={(e) => setDraftItem((value) => ({ ...value, produtoId: Number(e.target.value) }))} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value={0}>Selecione um produto</option>{produtos.filter((produto) => produto.quantidadeEstoque > 0).map((produto) => <option key={produto.id} value={produto.id}>{produto.nome} — {produto.quantidadeEstoque} un.</option>)}</select><input type="number" min="1" step="1" value={draftItem.quantidade} onChange={(e) => setDraftItem((value) => ({ ...value, quantidade: Number(e.target.value) }))} className="h-11 rounded-xl border border-slate-200 px-3 text-sm" aria-label="Quantidade" /><button type="button" onClick={addItem} className="h-11 rounded-xl border border-teal-200 bg-teal-50 px-4 text-sm font-semibold text-teal-800">Adicionar</button></div>{form.itens.length > 0 && <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100">{form.itens.map((item) => { const produto = produtos.find((p) => p.id === item.produtoId); return <div key={item.produtoId} className="flex items-center gap-3 py-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{produto?.nome}</p><p className="text-xs text-slate-500">{item.quantidade} × {formatCurrency(produto?.preco ?? 0)}</p></div><p className="text-sm font-semibold">{formatCurrency((produto?.preco ?? 0) * item.quantidade)}</p><button type="button" onClick={() => setForm((value) => ({ ...value, itens: value.itens.filter((entry) => entry.produtoId !== item.produtoId) }))} className="grid size-8 place-items-center text-rose-600" aria-label="Remover item"><X className="size-4" /></button></div>; })}</div>}</div><div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm font-semibold text-slate-700">Previsão de entrega<input type="date" min={new Date().toISOString().slice(0, 10)} value={form.dataPrevisao ?? ""} onChange={(e) => setForm((value) => ({ ...value, dataPrevisao: e.target.value || null }))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></label><div className="rounded-xl bg-slate-900 p-4 text-white"><p className="text-xs font-medium text-slate-400">Valor total</p><p className="mt-1 text-2xl font-semibold">{formatCurrency(total)}</p><p className="mt-1 text-[11px] text-slate-400">Calculado novamente pelo backend</p></div></div><label className="block text-sm font-semibold text-slate-700">Observações<textarea value={form.observacoes} onChange={(e) => setForm((value) => ({ ...value, observacoes: e.target.value }))} className="mt-2 min-h-24 w-full resize-y rounded-xl border border-slate-200 p-3.5 text-sm" maxLength={1000} placeholder="Receita, montagem ou cuidados especiais" /></label></div><Footer saving={saving} cancel={() => setFormOpen(false)} /></form></Modal>

    <Modal open={viewing !== null || viewLoading} title={viewing ? `Pedido #${String(viewing.id).padStart(4, "0")}` : "Carregando pedido"} description="Acompanhamento completo do pedido." onClose={() => !viewLoading && !statusLoading && setViewing(null)} closeDisabled={viewLoading || statusLoading} size="lg"><div className="px-5 py-6 sm:px-6">{viewLoading && !viewing ? <div className="grid min-h-48 place-items-center"><LoaderCircle className="size-6 animate-spin text-teal-700" /></div> : viewing && <OrderDetail pedido={viewing} loading={statusLoading} onStatus={(next) => void changeStatus(viewing, next)} />}</div></Modal>
    <Modal open={deleteTarget !== null} title="Excluir pedido cancelado?" description="O histórico deste pedido será removido." onClose={() => !deleting && setDeleteTarget(null)} closeDisabled={deleting} size="sm"><div className="px-5 py-6 text-sm text-slate-600">Confirma a exclusão do pedido <strong>#{deleteTarget?.id}</strong> de <strong>{deleteTarget?.cliente.nome}</strong>?</div><div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end"><button onClick={() => setDeleteTarget(null)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold">Cancelar</button><button onClick={() => void remove()} disabled={deleting} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white">{deleting ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Excluir</button></div></Modal>
  </div>;
}

function OrderDetail({ pedido, loading, onStatus }: { pedido: Pedido; loading: boolean; onStatus: (status: StatusPedido) => void }) { const next = nextStatus[pedido.status]; return <div><div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-2xl bg-teal-50 text-teal-700"><UserRound className="size-5" /></span><div><p className="font-semibold text-slate-950">{pedido.cliente.nome}</p><p className="mt-1 text-xs text-slate-500">Criado em {formatDate(pedido.dataPedido)}</p></div></div><StatusBadge status={pedido.status} /></div><div className="mt-5 overflow-hidden rounded-xl border border-slate-100"><div className="bg-slate-50 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Itens do pedido</div>{pedido.itens.map((item) => <div key={item.id} className="flex items-center gap-3 border-t border-slate-100 px-4 py-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{item.produtoNome}</p><p className="mt-0.5 text-xs text-slate-500">{item.quantidade} × {formatCurrency(item.precoUnitario)}</p></div><p className="text-sm font-semibold">{formatCurrency(item.subtotal)}</p></div>)}<div className="flex justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold"><span>Total</span><span>{formatCurrency(pedido.valorTotal)}</span></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><Info label="Previsão" value={pedido.dataPrevisao ? formatDate(`${pedido.dataPrevisao}T12:00:00`) : "Não informada"} /><Info label="Quantidade de itens" value={`${pedido.itens.reduce((sum, item) => sum + item.quantidade, 0)} unidade(s)`} /></div>{pedido.observacoes && <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>Observações:</strong> {pedido.observacoes}</div>}{pedido.status !== "ENTREGUE" && pedido.status !== "CANCELADO" && <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><button disabled={loading} onClick={() => onStatus("CANCELADO")} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700"><Ban className="size-4" /> Cancelar pedido</button>{next && <button disabled={loading} onClick={() => onStatus(next)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white">{loading ? <LoaderCircle className="size-4 animate-spin" /> : <CircleCheckBig className="size-4" />} Avançar para {statusLabels[next]}</button>}</div>}</div>; }
function StatusBadge({ status }: { status: StatusPedido }) { const icons = { RECEBIDO: ShoppingBag, EM_PRODUCAO: Clock3, PRONTO: PackageCheck, ENTREGUE: CircleCheckBig, CANCELADO: Ban }; const Icon = icons[status]; return <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusTone[status]}`}><Icon className="size-3.5" />{statusLabels[status]}</span>; }
function Action({ icon: Icon, label, onClick, danger = false }: { icon: typeof Eye; label: string; onClick: () => void; danger?: boolean }) { return <button onClick={onClick} className={`grid size-9 place-items-center rounded-xl border border-slate-200 text-slate-500 ${danger ? "hover:bg-rose-50 hover:text-rose-700" : "hover:bg-teal-50 hover:text-teal-700"}`} aria-label={label} title={label}><Icon className="size-4" /></button>; }
function Footer({ saving, cancel }: { saving: boolean; cancel: () => void }) { return <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6"><button type="button" onClick={cancel} disabled={saving} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold">Cancelar</button><button disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white">{saving ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}{saving ? "Criando..." : "Criar pedido"}</button></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-3.5"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-sm font-semibold text-slate-800">{value}</p></div>; }
function Alert({ message }: { message: string }) { return <div className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle className="mt-0.5 size-4 shrink-0" />{message}</div>; }
function Toast({ message, onClose }: { message: string; onClose: () => void }) { return <div className="fixed right-4 top-24 z-[80] flex max-w-sm items-center gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-900 shadow-xl"><Check className="size-4" />{message}<button onClick={onClose}><X className="size-4 text-slate-400" /></button></div>; }
function Rows() { return <div>{Array.from({ length: 7 }).map((_, index) => <div key={index} className="h-17 animate-pulse border-b border-slate-100 bg-slate-50/60" />)}</div>; }
function ErrorState({ message, retry }: { message: string; retry: () => void }) { return <div className="grid min-h-80 place-items-center p-6 text-center"><div><AlertCircle className="mx-auto size-7 text-rose-600" /><p className="mt-3 text-sm text-slate-600">{message}</p><button onClick={retry} className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold">Tentar novamente</button></div></div>; }
function Empty({ onCreate }: { onCreate: () => void }) { return <div className="grid min-h-80 place-items-center text-center"><div><ShoppingBag className="mx-auto size-9 text-slate-300" /><h3 className="mt-3 font-semibold text-slate-900">Nenhum pedido encontrado</h3><p className="mt-2 text-sm text-slate-500">Crie um novo pedido ou altere os filtros.</p><button onClick={onCreate} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white"><Plus className="size-4" /> Novo pedido</button></div></div>; }
