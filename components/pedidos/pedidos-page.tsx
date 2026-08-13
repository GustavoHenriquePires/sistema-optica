"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Ban,
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
  ClipboardList,
  Clock3,
  Eye,
  LoaderCircle,
  PackageCheck,
  Plus,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import { DemoBanner } from "@/components/ui/demo-banner";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { DEMO_MODE } from "@/services/config";
import {
  atualizarStatusPedido,
  buscarPedido,
  excluirPedido,
  listarPedidos,
  resetarPedidosDemo,
} from "@/services/pedidos";
import type { PaginaResponse } from "@/types/api";
import {
  nextStatus,
  statusLabels,
  type Pedido,
  type StatusPedido,
} from "@/types/pedido";

const statusTone: Record<StatusPedido, string> = {
  RECEBIDO: "bg-sky-50 text-sky-700 ring-sky-200",
  EM_PRODUCAO: "bg-amber-50 text-amber-700 ring-amber-200",
  PRONTO: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  ENTREGUE: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  CANCELADO: "bg-rose-50 text-rose-700 ring-rose-200",
};

export function PedidosPage() {
  const [data, setData] = useState<PaginaResponse<Pedido> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusPedido | "">("");
  const [viewing, setViewing] = useState<Pedido | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Pedido | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await listarPedidos({ cliente: search, status, page, size: 10 }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar as ordens de serviço.");
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function view(id: number) {
    setViewLoading(true);
    try {
      setViewing(await buscarPedido(id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Ordem de serviço não encontrada.");
    } finally {
      setViewLoading(false);
    }
  }

  async function changeStatus(pedido: Pedido, next: StatusPedido) {
    setStatusLoading(true);
    try {
      const updated = await atualizarStatusPedido(pedido.id, next);
      setViewing(updated);
      setToast(`${osNumber(updated)}: ${statusLabels[next]}.`);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível atualizar a OS.");
    } finally {
      setStatusLoading(false);
    }
  }

  async function remove() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await excluirPedido(deleteTarget.id);
      setDeleteTarget(null);
      setToast("Ordem de serviço excluída.");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível excluir a OS.");
    } finally {
      setDeleting(false);
    }
  }

  async function resetDemo() {
    setResetting(true);
    try {
      await resetarPedidosDemo();
      setSearchInput("");
      setSearch("");
      setStatus("");
      setPage(0);
      setToast("Dados de demonstração restaurados.");
      await load();
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-6">
      {toast && <Toast message={toast} />}

      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-teal-700">Produção</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-[28px]">Ordens de serviço</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Acompanhe as OS recebidas, em produção, prontas e entregues.</p>
        </div>
        <Link href="/pedidos/nova-os" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800">
          <Plus className="size-4" /> Registrar nova OS
        </Link>
      </section>

      {DEMO_MODE && (
        <DemoBanner
          description="teste o acompanhamento das ordens de serviço com dados salvos no navegador."
          onReset={() => void resetDemo()}
          resetting={resetting}
        />
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:p-5 lg:grid-cols-[minmax(280px,1fr)_200px]">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setPage(0);
              setSearch(searchInput.trim());
            }}
            className="flex gap-2"
          >
            <label className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm focus:border-teal-500" placeholder="Pesquisar por cliente" />
            </label>
            <button className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700">Buscar</button>
          </form>
          <select value={status} onChange={(e) => { setStatus(e.target.value as StatusPedido | ""); setPage(0); }} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700">
            <option value="">Todos os status</option>
            {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>

        {error ? <ErrorState message={error} retry={() => void load()} /> : loading ? <Rows /> : data?.content.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3.5">OS</th><th className="px-4 py-3.5">Cliente</th><th className="px-4 py-3.5">Prioridade</th><th className="px-4 py-3.5">Entrada</th><th className="px-4 py-3.5">Previsão</th><th className="px-4 py-3.5">Status</th><th className="px-5 py-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((pedido) => (
                    <tr key={pedido.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                      <td className="px-5 py-4 text-sm font-bold text-slate-900">{osNumber(pedido)}</td>
                      <td className="px-4 py-4"><p className="text-sm font-semibold text-slate-900">{pedido.cliente.nome}</p><p className="mt-0.5 text-xs text-slate-500">{pedido.tipoLente || pedido.itens[0]?.produtoNome || "Serviço óptico"}</p></td>
                      <td className="px-4 py-4"><Priority prioridade={pedido.prioridade} /></td>
                      <td className="px-4 py-4 text-sm text-slate-600">{formatDate(pedido.dataPedido)}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">{pedido.dataPrevisao ? formatDate(`${pedido.dataPrevisao}T12:00:00`) : "—"}</td>
                      <td className="px-4 py-4"><StatusBadge status={pedido.status} /></td>
                      <td className="px-5 py-4"><div className="flex justify-end gap-1.5"><Action icon={Eye} label="Visualizar OS" onClick={() => void view(pedido.id)} />{pedido.status === "CANCELADO" && <Action icon={Trash2} label="Excluir OS" onClick={() => setDeleteTarget(pedido)} danger />}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
              <p className="text-xs text-slate-500">{data.totalElements} ordem(ns) de serviço</p>
              <div className="flex items-center gap-2"><button disabled={data.first} onClick={() => setPage(page - 1)} className="grid size-9 place-items-center rounded-lg border border-slate-200 disabled:opacity-40"><ChevronLeft className="size-4" /></button><span className="text-sm font-semibold">{page + 1}</span><button disabled={data.last} onClick={() => setPage(page + 1)} className="grid size-9 place-items-center rounded-lg border border-slate-200 disabled:opacity-40"><ChevronRight className="size-4" /></button></div>
            </div>
          </>
        ) : <Empty />}
      </section>

      <Modal open={viewing !== null || viewLoading} title={viewing ? osNumber(viewing) : "Carregando OS"} description="Dados técnicos e acompanhamento da ordem de serviço." onClose={() => !viewLoading && !statusLoading && setViewing(null)} closeDisabled={viewLoading || statusLoading} size="lg">
        <div className="px-5 py-6 sm:px-6">{viewLoading && !viewing ? <div className="grid min-h-48 place-items-center"><LoaderCircle className="size-6 animate-spin text-teal-700" /></div> : viewing && <OrderDetail pedido={viewing} loading={statusLoading} onStatus={(next) => void changeStatus(viewing, next)} />}</div>
      </Modal>

      <Modal open={deleteTarget !== null} title="Excluir OS cancelada?" description="O histórico desta ordem será removido." onClose={() => !deleting && setDeleteTarget(null)} closeDisabled={deleting} size="sm">
        <div className="px-5 py-6 text-sm text-slate-600">Confirma a exclusão da <strong>{deleteTarget ? osNumber(deleteTarget) : "OS"}</strong> de <strong>{deleteTarget?.cliente.nome}</strong>?</div>
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end"><button onClick={() => setDeleteTarget(null)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold">Cancelar</button><button onClick={() => void remove()} disabled={deleting} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white">{deleting ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Excluir</button></div>
      </Modal>
    </div>
  );
}

function OrderDetail({ pedido, loading, onStatus }: { pedido: Pedido; loading: boolean; onStatus: (status: StatusPedido) => void }) {
  const next = nextStatus[pedido.status];
  return <div>
    <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-2xl bg-teal-50 text-teal-700"><UserRound className="size-5" /></span><div><p className="font-semibold text-slate-950">{pedido.cliente.nome}</p><p className="mt-1 text-xs text-slate-500">Entrada em {formatDate(pedido.dataPedido)}</p></div></div>
      <div className="flex gap-2"><Priority prioridade={pedido.prioridade} /><StatusBadge status={pedido.status} /></div>
    </div>

    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Info label="Tipo de lente" value={pedido.tipoLente || pedido.itens[0]?.produtoNome || "Não informado"} />
      <Info label="Material / índice" value={pedido.materialLente || "Não informado"} />
      <Info label="Tratamento" value={pedido.tratamento || "Não informado"} />
      <Info label="Armação" value={pedido.armacao || "Não informada"} />
    </div>

    <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[700px] text-sm">
        <thead><tr className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500"><th className="px-4 py-3">Olho</th><th className="px-3 py-3">Esférico</th><th className="px-3 py-3">Cilíndrico</th><th className="px-3 py-3">Eixo</th><th className="px-3 py-3">Adição</th><th className="px-3 py-3">DNP</th><th className="px-3 py-3">Altura</th></tr></thead>
        <tbody>
          <OpticalRow eye="OD" values={[pedido.odEsferico, pedido.odCilindrico, pedido.odEixo, pedido.odAdicao, pedido.odDnp, pedido.odAltura]} />
          <OpticalRow eye="OE" values={[pedido.oeEsferico, pedido.oeCilindrico, pedido.oeEixo, pedido.oeAdicao, pedido.oeDnp, pedido.oeAltura]} />
        </tbody>
      </table>
    </div>

    <div className="mt-4 grid gap-3 sm:grid-cols-2"><Info label="Previsão" value={pedido.dataPrevisao ? formatDate(`${pedido.dataPrevisao}T12:00:00`) : "Não informada"} /><Info label="Valor vinculado" value={formatCurrency(pedido.valorTotal)} /></div>
    {pedido.observacoes && <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>Observações técnicas:</strong> {pedido.observacoes}</div>}

    {pedido.status !== "ENTREGUE" && pedido.status !== "CANCELADO" && <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><button disabled={loading} onClick={() => onStatus("CANCELADO")} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700"><Ban className="size-4" /> Cancelar OS</button>{next && <button disabled={loading} onClick={() => onStatus(next)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white">{loading ? <LoaderCircle className="size-4 animate-spin" /> : <CircleCheckBig className="size-4" />} Avançar para {statusLabels[next]}</button>}</div>}
  </div>;
}

function OpticalRow({ eye, values }: { eye: string; values: Array<number | null | undefined> }) {
  return <tr className="border-t border-slate-100"><td className="px-4 py-3 font-bold text-slate-900">{eye}</td>{values.map((value, index) => <td key={index} className="px-3 py-3 text-slate-700">{value === null || value === undefined ? "—" : index === 2 ? value : Number(value).toFixed(2)}</td>)}</tr>;
}

function osNumber(pedido: Pedido) { return pedido.numeroOs || `OS-${String(pedido.id).padStart(6, "0")}`; }
function Priority({ prioridade }: { prioridade?: "NORMAL" | "URGENTE" }) { return prioridade === "URGENTE" ? <span className="inline-flex rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-200">Urgente</span> : <span className="inline-flex rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">Normal</span>; }
function StatusBadge({ status }: { status: StatusPedido }) { const icons = { RECEBIDO: ClipboardList, EM_PRODUCAO: Clock3, PRONTO: PackageCheck, ENTREGUE: CircleCheckBig, CANCELADO: Ban }; const Icon = icons[status]; return <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusTone[status]}`}><Icon className="size-3.5" />{statusLabels[status]}</span>; }
function Action({ icon: Icon, label, onClick, danger = false }: { icon: typeof Eye; label: string; onClick: () => void; danger?: boolean }) { return <button onClick={onClick} className={`grid size-9 place-items-center rounded-xl border border-slate-200 text-slate-500 ${danger ? "hover:bg-rose-50 hover:text-rose-700" : "hover:bg-teal-50 hover:text-teal-700"}`} aria-label={label} title={label}><Icon className="size-4" /></button>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-3.5"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-sm font-semibold text-slate-800">{value}</p></div>; }
function Toast({ message }: { message: string }) { return <div className="fixed right-4 top-24 z-[80] max-w-sm rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-900 shadow-xl">{message}</div>; }
function Rows() { return <div>{Array.from({ length: 7 }).map((_, index) => <div key={index} className="h-17 animate-pulse border-b border-slate-100 bg-slate-50/60" />)}</div>; }
function ErrorState({ message, retry }: { message: string; retry: () => void }) { return <div className="grid min-h-80 place-items-center p-6 text-center"><div><AlertCircle className="mx-auto size-7 text-rose-600" /><p className="mt-3 text-sm text-slate-600">{message}</p><button onClick={retry} className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold">Tentar novamente</button></div></div>; }
function Empty() { return <div className="grid min-h-80 place-items-center text-center"><div><ClipboardList className="mx-auto size-9 text-slate-300" /><h3 className="mt-3 font-semibold text-slate-900">Nenhuma OS encontrada</h3><p className="mt-2 text-sm text-slate-500">Registre uma nova ordem de serviço ou altere os filtros.</p><Link href="/pedidos/nova-os" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white"><Plus className="size-4" /> Registrar nova OS</Link></div></div>; }
