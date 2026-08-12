"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Glasses,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { DemoBanner } from "@/components/ui/demo-banner";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { ApiClientError } from "@/services/api";
import { DEMO_MODE } from "@/services/config";
import {
  atualizarProduto,
  buscarProduto,
  criarProduto,
  excluirProduto,
  listarProdutos,
  resetarProdutosDemo,
} from "@/services/produtos";
import type { PaginaResponse } from "@/types/api";
import {
  categoriaLabels,
  type CategoriaProduto,
  type Produto,
  type ProdutoRequest,
} from "@/types/produto";

type FormMode = "create" | "edit" | null;
type FieldErrors = Partial<Record<keyof ProdutoRequest, string>>;

const emptyForm: ProdutoRequest = {
  nome: "",
  categoria: "ARMACAO",
  marca: "",
  descricao: "",
  preco: 0,
  quantidadeEstoque: 0,
  ativo: true,
};

const categoryTone: Record<CategoriaProduto, string> = {
  ARMACAO: "bg-indigo-50 text-indigo-700",
  LENTE: "bg-sky-50 text-sky-700",
  OCULOS_SOL: "bg-amber-50 text-amber-700",
  ACESSORIO: "bg-slate-100 text-slate-700",
};

function validate(form: ProdutoRequest): FieldErrors {
  const errors: FieldErrors = {};
  if (form.nome.trim().length < 2) errors.nome = "Informe um nome com ao menos 2 caracteres.";
  if (!form.categoria) errors.categoria = "Selecione uma categoria.";
  if (!Number.isFinite(form.preco) || form.preco <= 0) errors.preco = "Informe um preço maior que zero.";
  if (!Number.isInteger(form.quantidadeEstoque) || form.quantidadeEstoque < 0) {
    errors.quantidadeEstoque = "Informe uma quantidade inteira igual ou maior que zero.";
  }
  if (form.marca.length > 80) errors.marca = "A marca deve ter no máximo 80 caracteres.";
  if (form.descricao.length > 500) errors.descricao = "A descrição deve ter no máximo 500 caracteres.";
  return errors;
}

function fieldClass(hasError: boolean) {
  return `mt-2 h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 ${hasError ? "border-rose-300" : "border-slate-200 focus:border-teal-500"}`;
}

export function ProdutosPage() {
  const [data, setData] = useState<PaginaResponse<Produto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoriaProduto | "">("");
  const [status, setStatus] = useState<"todos" | "ativos" | "inativos">("todos");
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [form, setForm] = useState<ProdutoRequest>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState<Produto | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Produto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await listarProdutos({
        nome: search,
        categoria: category,
        ativo: status === "todos" ? undefined : status === "ativos",
        page,
        size: 10,
      }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar os produtos.");
    } finally {
      setLoading(false);
    }
  }, [category, page, search, status]);

  useEffect(() => {
    let active = true;
    listarProdutos({
      nome: search,
      categoria: category,
      ativo: status === "todos" ? undefined : status === "ativos",
      page,
      size: 10,
    }).then((response) => {
      if (!active) return;
      setData(response);
      setError(null);
      setLoading(false);
    }).catch((caught: unknown) => {
      if (!active) return;
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar os produtos.");
      setLoading(false);
    });
    return () => { active = false; };
  }, [category, page, search, status]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function openCreate() {
    setForm({ ...emptyForm });
    setEditingId(null);
    setFieldErrors({});
    setFormError(null);
    setFormMode("create");
  }

  function openEdit(produto: Produto) {
    setForm({
      nome: produto.nome,
      categoria: produto.categoria,
      marca: produto.marca ?? "",
      descricao: produto.descricao ?? "",
      preco: produto.preco,
      quantidadeEstoque: produto.quantidadeEstoque,
      ativo: produto.ativo,
    });
    setEditingId(produto.id);
    setFieldErrors({});
    setFormError(null);
    setFormMode("edit");
  }

  function closeForm() {
    if (saving) return;
    setFormMode(null);
    setEditingId(null);
    setFormError(null);
    setFieldErrors({});
  }

  function update<K extends keyof ProdutoRequest>(field: K, value: ProdutoRequest[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validate(form);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setFormError("Revise os campos destacados.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (formMode === "edit" && editingId !== null) {
        await atualizarProduto(editingId, form);
        setToast("Produto atualizado com sucesso.");
      } else {
        await criarProduto(form);
        setToast("Produto cadastrado com sucesso.");
      }
      closeAfterSave();
      if (page !== 0) setPage(0); else await load();
    } catch (caught) {
      if (caught instanceof ApiClientError) {
        setFormError(caught.message);
        setFieldErrors(caught.fieldErrors as FieldErrors);
      } else setFormError("Não foi possível salvar o produto.");
    } finally {
      setSaving(false);
    }
  }

  function closeAfterSave() {
    setFormMode(null);
    setEditingId(null);
    setFieldErrors({});
  }

  async function view(id: number) {
    setViewLoading(true);
    try { setViewing(await buscarProduto(id)); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Produto não encontrado."); }
    finally { setViewLoading(false); }
  }

  async function remove() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await excluirProduto(deleteTarget.id);
      setDeleteTarget(null);
      setToast("Produto excluído com sucesso.");
      if (data?.content.length === 1 && page > 0) setPage((current) => current - 1); else await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível excluir o produto.");
      setDeleteTarget(null);
    } finally { setDeleting(false); }
  }

  async function resetDemo() {
    setResetting(true);
    try {
      await resetarProdutosDemo();
      setSearchInput(""); setSearch(""); setCategory(""); setStatus("todos"); setPage(0);
      setToast("Produtos de demonstração restaurados.");
      setData(await listarProdutos({ page: 0, size: 10 }));
    } finally { setResetting(false); }
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setPage(0);
    setSearch(searchInput.trim());
  }

  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-6">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-teal-700">Catálogo</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-[28px]">Gestão de produtos</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Organize armações, lentes, solares e acessórios em um só lugar.</p>
        </div>
        <button type="button" onClick={openCreate} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800">
          <Plus className="size-4" aria-hidden="true" /> Novo produto
        </button>
      </section>

      {DEMO_MODE && <DemoBanner description="teste livremente o cadastro e a manutenção do catálogo." onReset={() => void resetDemo()} resetting={resetting} />}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:p-5 lg:grid-cols-[minmax(280px,1fr)_190px_160px]">
          <form onSubmit={submitSearch} className="flex gap-2">
            <label className="relative flex-1">
              <span className="sr-only">Pesquisar produto</span>
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-9 text-sm focus:border-teal-500 focus:bg-white" placeholder="Pesquisar por nome" />
              {searchInput && <button type="button" onClick={() => { setSearchInput(""); setSearch(""); setPage(0); }} className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center text-slate-400" aria-label="Limpar"><X className="size-4" /></button>}
            </label>
            <button className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Buscar</button>
          </form>
          <select value={category} onChange={(event) => { setLoading(true); setCategory(event.target.value as CategoriaProduto | ""); setPage(0); }} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700" aria-label="Filtrar categoria">
            <option value="">Todas as categorias</option>
            {Object.entries(categoriaLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select value={status} onChange={(event) => { setLoading(true); setStatus(event.target.value as typeof status); setPage(0); }} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700" aria-label="Filtrar situação">
            <option value="todos">Todos</option><option value="ativos">Ativos</option><option value="inativos">Inativos</option>
          </select>
        </div>

        {error ? (
          <ErrorState message={error} retry={() => void load()} />
        ) : loading ? (
          <LoadingRows />
        ) : data && data.content.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left">
                <thead><tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-[.12em] text-slate-500"><th className="px-5 py-3.5">Produto</th><th className="px-4 py-3.5">Categoria</th><th className="px-4 py-3.5">Preço</th><th className="px-4 py-3.5">Estoque</th><th className="px-4 py-3.5">Situação</th><th className="px-5 py-3.5 text-right">Ações</th></tr></thead>
                <tbody>{data.content.map((produto) => (
                  <tr key={produto.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                    <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><Glasses className="size-5" /></span><div><p className="max-w-xs truncate text-sm font-semibold text-slate-900">{produto.nome}</p><p className="mt-0.5 text-xs text-slate-500">{produto.marca || "Sem marca"}</p></div></div></td>
                    <td className="px-4 py-4"><span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${categoryTone[produto.categoria]}`}>{categoriaLabels[produto.categoria]}</span></td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-800">{formatCurrency(produto.preco)}</td>
                    <td className="px-4 py-4"><StockBadge quantity={produto.quantidadeEstoque} /></td>
                    <td className="px-4 py-4"><span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${produto.ativo ? "text-emerald-700" : "text-slate-400"}`}><span className={`size-2 rounded-full ${produto.ativo ? "bg-emerald-500" : "bg-slate-300"}`} />{produto.ativo ? "Ativo" : "Inativo"}</span></td>
                    <td className="px-5 py-4"><div className="flex justify-end gap-1.5"><Action icon={Eye} label={`Visualizar ${produto.nome}`} onClick={() => void view(produto.id)} /><Action icon={Pencil} label={`Editar ${produto.nome}`} onClick={() => openEdit(produto)} tone="blue" /><Action icon={Trash2} label={`Excluir ${produto.nome}`} onClick={() => setDeleteTarget(produto)} tone="red" /></div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <Pagination page={page} data={data} onPage={(nextPage) => { setLoading(true); setPage(nextPage); }} />
          </>
        ) : (
          <div className="grid min-h-80 place-items-center px-6 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-teal-50 text-teal-700"><Glasses className="size-6" /></span><h3 className="mt-4 font-semibold text-slate-900">Nenhum produto encontrado</h3><p className="mt-2 text-sm text-slate-500">Ajuste os filtros ou cadastre um novo item.</p></div></div>
        )}
      </section>

      <Modal open={formMode !== null} title={formMode === "edit" ? "Editar produto" : "Cadastrar produto"} description="Preencha as informações do catálogo e do estoque." onClose={closeForm} closeDisabled={saving} size="lg">
        <form onSubmit={submit} noValidate>
          <div className="space-y-5 px-5 py-5 sm:px-6">
            {formError && <FormAlert message={formError} />}
            <label className="block text-sm font-semibold text-slate-700">Nome <span className="text-rose-600">*</span><input autoFocus value={form.nome} onChange={(e) => update("nome", e.target.value)} className={fieldClass(Boolean(fieldErrors.nome))} placeholder="Ex.: Armação Urban 402" />{fieldErrors.nome && <FieldError>{fieldErrors.nome}</FieldError>}</label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">Categoria <span className="text-rose-600">*</span><select value={form.categoria} onChange={(e) => update("categoria", e.target.value as CategoriaProduto)} className={fieldClass(Boolean(fieldErrors.categoria))}>{Object.entries(categoriaLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{fieldErrors.categoria && <FieldError>{fieldErrors.categoria}</FieldError>}</label>
              <label className="block text-sm font-semibold text-slate-700">Marca<input value={form.marca} onChange={(e) => update("marca", e.target.value)} className={fieldClass(Boolean(fieldErrors.marca))} placeholder="Ex.: Hoya" maxLength={80} />{fieldErrors.marca && <FieldError>{fieldErrors.marca}</FieldError>}</label>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">Preço <span className="text-rose-600">*</span><input type="number" min="0.01" step="0.01" value={form.preco || ""} onChange={(e) => update("preco", Number(e.target.value))} className={fieldClass(Boolean(fieldErrors.preco))} placeholder="0,00" />{fieldErrors.preco && <FieldError>{fieldErrors.preco}</FieldError>}</label>
              <label className="block text-sm font-semibold text-slate-700">Quantidade em estoque <span className="text-rose-600">*</span><input type="number" min="0" step="1" value={form.quantidadeEstoque} onChange={(e) => update("quantidadeEstoque", Number(e.target.value))} className={fieldClass(Boolean(fieldErrors.quantidadeEstoque))} />{fieldErrors.quantidadeEstoque && <FieldError>{fieldErrors.quantidadeEstoque}</FieldError>}</label>
            </div>
            <label className="block text-sm font-semibold text-slate-700">Descrição<textarea value={form.descricao} onChange={(e) => update("descricao", e.target.value)} className="mt-2 min-h-24 w-full resize-y rounded-xl border border-slate-200 p-3.5 text-sm focus:border-teal-500" maxLength={500} placeholder="Características importantes do produto" />{fieldErrors.descricao && <FieldError>{fieldErrors.descricao}</FieldError>}</label>
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.ativo} onChange={(e) => update("ativo", e.target.checked)} className="size-4 accent-teal-700" /> Produto ativo e disponível para venda</label>
          </div>
          <ModalFooter saving={saving} onCancel={closeForm} submitLabel={formMode === "edit" ? "Salvar alterações" : "Cadastrar produto"} />
        </form>
      </Modal>

      <Modal open={viewing !== null || viewLoading} title="Detalhes do produto" description="Informações completas do catálogo." onClose={() => !viewLoading && setViewing(null)} closeDisabled={viewLoading}>
        <div className="px-5 py-6 sm:px-6">{viewLoading && !viewing ? <div className="grid min-h-44 place-items-center"><LoaderCircle className="size-6 animate-spin text-teal-700" /></div> : viewing && <div><div className="flex items-start gap-4 border-b border-slate-100 pb-5"><span className="grid size-14 place-items-center rounded-2xl bg-teal-50 text-teal-700"><Glasses className="size-6" /></span><div><h3 className="text-lg font-semibold text-slate-950">{viewing.nome}</h3><p className="mt-1 text-sm text-slate-500">{viewing.marca || "Sem marca informada"}</p></div></div><dl className="mt-5 grid gap-3 sm:grid-cols-2"><Info label="Categoria" value={categoriaLabels[viewing.categoria]} /><Info label="Preço" value={formatCurrency(viewing.preco)} /><Info label="Estoque" value={`${viewing.quantidadeEstoque} unidade(s)`} /><Info label="Cadastro" value={formatDate(viewing.dataCadastro)} /><Info label="Situação" value={viewing.ativo ? "Ativo" : "Inativo"} /><Info label="Código" value={`#${viewing.id}`} /></dl>{viewing.descricao && <div className="mt-4 rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Descrição</p><p className="mt-2 text-sm leading-6 text-slate-700">{viewing.descricao}</p></div>}<div className="mt-5 flex justify-end"><button onClick={() => { const item = viewing; setViewing(null); openEdit(item); }} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white"><Pencil className="size-4" /> Editar produto</button></div></div>}</div>
      </Modal>

      <Modal open={deleteTarget !== null} title="Excluir produto?" description="Esta ação remove o item do catálogo." onClose={() => !deleting && setDeleteTarget(null)} closeDisabled={deleting} size="sm">
        <div className="px-5 py-6 text-sm leading-6 text-slate-600">Tem certeza que deseja excluir <strong className="text-slate-900">{deleteTarget?.nome}</strong>?</div>
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end"><button onClick={() => setDeleteTarget(null)} disabled={deleting} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">Cancelar</button><button onClick={() => void remove()} disabled={deleting} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white">{deleting ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Excluir produto</button></div>
      </Modal>
    </div>
  );
}

function StockBadge({ quantity }: { quantity: number }) {
  const tone = quantity === 0 ? "bg-rose-50 text-rose-700" : quantity <= 5 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700";
  return <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${tone}`}>{quantity} un.</span>;
}

function Action({ icon: Icon, label, onClick, tone = "teal" }: { icon: typeof Eye; label: string; onClick: () => void; tone?: "teal" | "blue" | "red" }) {
  const tones = { teal: "hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700", blue: "hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700", red: "hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700" };
  return <button type="button" onClick={onClick} className={`grid size-9 place-items-center rounded-xl border border-slate-200 text-slate-500 ${tones[tone]}`} aria-label={label} title={label}><Icon className="size-4" /></button>;
}

function Pagination({ page, data, onPage }: { page: number; data: PaginaResponse<Produto>; onPage: (page: number) => void }) {
  return <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4"><p className="text-xs text-slate-500">{data.totalElements} produto(s)</p><nav className="flex items-center gap-2" aria-label="Paginação"><button disabled={data.first} onClick={() => onPage(page - 1)} className="grid size-9 place-items-center rounded-lg border border-slate-200 disabled:opacity-40"><ChevronLeft className="size-4" /></button><span className="min-w-9 text-center text-sm font-semibold text-slate-700">{page + 1}</span><button disabled={data.last} onClick={() => onPage(page + 1)} className="grid size-9 place-items-center rounded-lg border border-slate-200 disabled:opacity-40"><ChevronRight className="size-4" /></button></nav></div>;
}

function LoadingRows() { return <div className="space-y-px">{Array.from({ length: 7 }).map((_, index) => <div key={index} className="flex gap-5 border-b border-slate-100 px-5 py-4"><div className="h-10 w-48 animate-pulse rounded-lg bg-slate-100" /><div className="ml-auto h-10 w-3/5 animate-pulse rounded-lg bg-slate-100" /></div>)}</div>; }
function ErrorState({ message, retry }: { message: string; retry: () => void }) { return <div className="grid min-h-80 place-items-center px-6 text-center"><div><AlertCircle className="mx-auto size-7 text-rose-600" /><h3 className="mt-3 font-semibold text-slate-900">Não foi possível carregar os produtos</h3><p className="mt-2 text-sm text-slate-500">{message}</p><button onClick={retry} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold"><RefreshCw className="size-4" /> Tentar novamente</button></div></div>; }
function Toast({ message, onClose }: { message: string; onClose: () => void }) { return <div className="fixed right-4 top-24 z-[80] flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-900 shadow-xl"><Check className="size-4" />{message}<button onClick={onClose} aria-label="Fechar"><X className="size-4 text-slate-400" /></button></div>; }
function FormAlert({ message }: { message: string }) { return <div className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle className="mt-0.5 size-4 shrink-0" />{message}</div>; }
function FieldError({ children }: { children: React.ReactNode }) { return <span className="mt-1.5 block text-xs font-medium text-rose-600">{children}</span>; }
function ModalFooter({ saving, onCancel, submitLabel }: { saving: boolean; onCancel: () => void; submitLabel: string }) { return <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6"><button type="button" onClick={onCancel} disabled={saving} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">Cancelar</button><button disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white">{saving ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}{saving ? "Salvando..." : submitLabel}</button></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-3.5"><dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</dt><dd className="mt-2 text-sm font-medium text-slate-800">{value}</dd></div>; }
