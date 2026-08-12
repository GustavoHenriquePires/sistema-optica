"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Database,
  Eye,
  FileText,
  LoaderCircle,
  Mail,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import {
  atualizarCliente,
  buscarCliente,
  criarCliente,
  DEMO_MODE,
  excluirCliente,
  listarClientes,
  resetarClientesDemo,
} from "@/services/clientes";
import { ApiClientError } from "@/services/api";
import type { PaginaResponse } from "@/types/api";
import type { Cliente, ClienteRequest } from "@/types/cliente";
import {
  formatCpf,
  formatDate,
  formatPhone,
  isValidCpf,
  onlyDigits,
  personInitials,
} from "@/lib/formatters";

type FormMode = "create" | "edit" | null;
type FieldErrors = Partial<Record<keyof ClienteRequest, string>>;

const emptyForm: ClienteRequest = {
  nome: "",
  cpf: "",
  telefone: "",
  email: "",
};

function validateForm(form: ClienteRequest): FieldErrors {
  const errors: FieldErrors = {};
  const nome = form.nome.trim();
  const telefone = onlyDigits(form.telefone);

  if (!nome) errors.nome = "Informe o nome do cliente.";
  else if (nome.length < 3) errors.nome = "O nome deve ter ao menos 3 caracteres.";
  else if (nome.length > 120) errors.nome = "O nome deve ter no máximo 120 caracteres.";

  if (!form.cpf) errors.cpf = "Informe o CPF.";
  else if (!isValidCpf(form.cpf)) errors.cpf = "Informe um CPF válido.";

  if (!telefone) errors.telefone = "Informe o telefone com DDD.";
  else if (telefone.length < 10 || telefone.length > 11) {
    errors.telefone = "O telefone deve conter 10 ou 11 dígitos.";
  }

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Informe um e-mail válido.";
  } else if (form.email.length > 150) {
    errors.email = "O e-mail deve ter no máximo 150 caracteres.";
  }

  return errors;
}

function inputClass(hasError: boolean) {
  return `mt-2 h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 ${
    hasError
      ? "border-rose-300 focus:border-rose-400"
      : "border-slate-200 focus:border-teal-500"
  }`;
}

export function ClientesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<PaginaResponse<Cliente> | null>(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [formMode, setFormMode] = useState<FormMode>(
    searchParams.get("novo") === "1" ? "create" : null,
  );
  const [form, setForm] = useState<ClienteRequest>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [viewing, setViewing] = useState<Cliente | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Cliente | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [resettingDemo, setResettingDemo] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    listarClientes({ nome: search, page, size: pageSize })
      .then((response) => {
        if (!active) return;
        setData(response);
        setListError(null);
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setListError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os clientes.",
        );
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, pageSize, search]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const reload = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const response = await listarClientes({ nome: search, page, size: pageSize });
      setData(response);
    } catch (error) {
      setListError(error instanceof Error ? error.message : "Não foi possível carregar os clientes.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  const visiblePages = useMemo(() => {
    const total = data?.totalPages ?? 0;
    if (total <= 1) return [];
    const start = Math.max(0, Math.min(page - 1, total - 3));
    return Array.from({ length: Math.min(3, total) }, (_, index) => start + index);
  }, [data?.totalPages, page]);

  function closeForm() {
    if (saving) return;
    setFormMode(null);
    setEditingId(null);
    setForm(emptyForm);
    setFieldErrors({});
    setFormError(null);
    if (searchParams.get("novo") === "1") router.replace("/clientes");
  }

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setFieldErrors({});
    setFormError(null);
    setFormMode("create");
  }

  function openEdit(cliente: Cliente) {
    setForm({
      nome: cliente.nome,
      cpf: formatCpf(cliente.cpf),
      telefone: formatPhone(cliente.telefone),
      email: cliente.email ?? "",
    });
    setEditingId(cliente.id);
    setFieldErrors({});
    setFormError(null);
    setFormMode("edit");
  }

  function updateField(field: keyof ClienteRequest, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((current) => ({ ...current, [field]: undefined }));
    }
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Revise os campos destacados antes de continuar.");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      if (formMode === "edit" && editingId !== null) {
        await atualizarCliente(editingId, form);
        setToast("Cliente atualizado com sucesso.");
      } else {
        await criarCliente(form);
        setToast("Cliente cadastrado com sucesso.");
      }
      closeFormAfterSave();
      if (page !== 0) setPage(0);
      else await reload();
    } catch (error) {
      if (error instanceof ApiClientError) {
        setFieldErrors(error.fieldErrors as FieldErrors);
        setFormError(error.message);
      } else {
        setFormError("Não foi possível salvar o cliente. Verifique a conexão com a API.");
      }
    } finally {
      setSaving(false);
    }
  }

  function closeFormAfterSave() {
    setFormMode(null);
    setEditingId(null);
    setForm(emptyForm);
    setFieldErrors({});
    if (searchParams.get("novo") === "1") router.replace("/clientes");
  }

  async function openView(id: number) {
    setViewing(null);
    setViewError(null);
    setViewLoading(true);
    try {
      setViewing(await buscarCliente(id));
    } catch (error) {
      setViewError(error instanceof Error ? error.message : "Não foi possível carregar o cliente.");
    } finally {
      setViewLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await excluirCliente(deleteTarget.id);
      setDeleteTarget(null);
      setToast("Cliente excluído com sucesso.");
      if (data?.content.length === 1 && page > 0) setPage((current) => current - 1);
      else await reload();
    } catch (error) {
      setListError(error instanceof Error ? error.message : "Não foi possível excluir o cliente.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextSearch = searchInput.trim();
    if (nextSearch === search) {
      void reload();
      return;
    }
    setLoading(true);
    setPage(0);
    setSearch(nextSearch);
  }

  function clearSearch() {
    setSearchInput("");
    if (!search) return;
    setLoading(true);
    setPage(0);
    setSearch("");
  }

  function changePage(nextPage: number) {
    setLoading(true);
    setPage(nextPage);
  }

  async function resetDemoData() {
    setResettingDemo(true);
    try {
      await resetarClientesDemo();
      setSearchInput("");
      setSearch("");
      setPage(0);
      setLoading(true);
      setListError(null);
      setData(await listarClientes({ page: 0, size: pageSize }));
      setToast("Dados de demonstração restaurados.");
    } catch (error) {
      setListError(
        error instanceof Error
          ? error.message
          : "Não foi possível restaurar os dados de demonstração.",
      );
    } finally {
      setLoading(false);
      setResettingDemo(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-6">
      {toast && (
        <div className="fixed right-4 top-24 z-[80] flex max-w-sm items-center gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-900 shadow-xl sm:right-6">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <Check className="size-4" aria-hidden="true" />
          </span>
          {toast}
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 text-slate-400 hover:text-slate-700"
            aria-label="Fechar mensagem"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-teal-700">Relacionamento</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-[28px]">
            Gestão de clientes
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Cadastre, consulte e mantenha os dados de contato da sua base de clientes.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-teal-800"
        >
          <Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
          Novo cliente
        </button>
      </section>

      {DEMO_MODE && (
        <section className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Database className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden="true" />
            <p className="leading-5">
              <strong>Modo demonstração:</strong> crie, visualize, edite, pesquise e exclua clientes livremente. Os dados ficam somente neste navegador.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void resetDemoData()}
            disabled={resettingDemo}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-4 font-semibold text-amber-800 hover:bg-amber-100 disabled:cursor-wait disabled:opacity-60"
          >
            {resettingDemo ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <RotateCcw className="size-4" aria-hidden="true" />
            )}
            Restaurar dados
          </button>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgb(15_23_42/0.03)]">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <form onSubmit={submitSearch} className="flex w-full gap-2 lg:max-w-xl" role="search">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Pesquisar por nome</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Pesquisar cliente por nome"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                  aria-label="Limpar pesquisa"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              )}
            </label>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
            >
              Buscar
            </button>
          </form>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className={`size-2 rounded-full ${DEMO_MODE ? "bg-amber-500" : "bg-emerald-500"}`} />
            {data ? `${data.totalElements} cliente${data.totalElements === 1 ? "" : "s"} cadastrado${data.totalElements === 1 ? "" : "s"}` : "Base de clientes"}
          </div>
        </div>

        {search && !loading && !listError && (
          <div className="flex items-center gap-2 border-b border-slate-100 bg-teal-50/50 px-4 py-2.5 text-xs text-teal-800 sm:px-5">
            <Search className="size-3.5" aria-hidden="true" />
            Resultados para <strong>“{search}”</strong>
            <button type="button" onClick={clearSearch} className="ml-auto font-semibold hover:underline">
              Limpar filtro
            </button>
          </div>
        )}

        {listError ? (
          <div className="grid min-h-96 place-items-center px-6 py-12 text-center">
            <div className="max-w-md">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-rose-50 text-rose-600">
                <AlertCircle className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-semibold text-slate-900">Não foi possível carregar os clientes</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{listError}</p>
              <button
                type="button"
                onClick={() => void reload()}
                className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                Tentar novamente
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="overflow-x-auto">
            <div className="min-w-[860px]">
              <div className="grid grid-cols-[minmax(220px,1.35fr)_180px_170px_minmax(210px,1fr)_130px] gap-4 border-b border-slate-100 bg-slate-50/80 px-5 py-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-3 w-20 animate-pulse rounded bg-slate-200" />
                ))}
              </div>
              {Array.from({ length: 6 }).map((_, row) => (
                <div key={row} className="grid grid-cols-[minmax(220px,1.35fr)_180px_170px_minmax(210px,1fr)_130px] gap-4 border-b border-slate-100 px-5 py-4">
                  {Array.from({ length: 5 }).map((_, column) => (
                    <div key={column} className={`h-9 animate-pulse rounded-lg bg-slate-100 ${column === 0 ? "w-48" : "w-28"}`} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : data && data.content.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    <th className="px-5 py-3.5">Cliente</th>
                    <th className="px-4 py-3.5">CPF</th>
                    <th className="px-4 py-3.5">Telefone</th>
                    <th className="px-4 py-3.5">Cadastro</th>
                    <th className="px-5 py-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((cliente) => (
                    <tr key={cliente.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-xs font-bold text-teal-700">
                            {personInitials(cliente.nome)}
                          </span>
                          <div className="min-w-0">
                            <p className="max-w-xs truncate text-sm font-semibold text-slate-900">{cliente.nome}</p>
                            <p className="mt-0.5 max-w-xs truncate text-xs text-slate-500">{cliente.email || "E-mail não informado"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">{formatCpf(cliente.cpf)}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">{formatPhone(cliente.telefone)}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">{formatDate(cliente.dataCadastro)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => void openView(cliente.id)}
                            className="grid size-9 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                            aria-label={`Visualizar ${cliente.nome}`}
                            title="Visualizar"
                          >
                            <Eye className="size-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(cliente)}
                            className="grid size-9 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                            aria-label={`Editar ${cliente.nome}`}
                            title="Editar"
                          >
                            <Pencil className="size-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(cliente)}
                            className="grid size-9 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                            aria-label={`Excluir ${cliente.nome}`}
                            title="Excluir"
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Exibir</span>
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setLoading(true);
                    setPage(0);
                    setPageSize(Number(event.target.value));
                  }}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm font-medium text-slate-700"
                  aria-label="Registros por página"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span>por página</span>
              </div>

              <nav className="flex items-center gap-1.5" aria-label="Paginação dos clientes">
                <button
                  type="button"
                  disabled={data.first}
                  onClick={() => changePage(page - 1)}
                  className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                </button>
                {visiblePages.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => changePage(pageNumber)}
                    className={`grid size-9 place-items-center rounded-lg text-sm font-semibold ${
                      pageNumber === page
                        ? "bg-teal-700 text-white"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                    aria-current={pageNumber === page ? "page" : undefined}
                  >
                    {pageNumber + 1}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={data.last}
                  onClick={() => changePage(page + 1)}
                  className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Próxima página"
                >
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </>
        ) : (
          <div className="grid min-h-96 place-items-center px-6 py-12 text-center">
            <div className="max-w-md">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-teal-50 text-teal-700">
                <UsersRound className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-semibold text-slate-900">
                {search ? "Nenhum cliente encontrado" : "Sua base de clientes começa aqui"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {search
                  ? "Tente pesquisar por outro nome ou limpe o filtro atual."
                  : "Cadastre o primeiro cliente para começar a organizar o atendimento da óptica."}
              </p>
              {search ? (
                <button type="button" onClick={clearSearch} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Limpar pesquisa
                </button>
              ) : (
                <button type="button" onClick={openCreate} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800">
                  <Plus className="size-4" aria-hidden="true" />
                  Cadastrar cliente
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      <Modal
        open={formMode !== null}
        title={formMode === "edit" ? "Editar cliente" : "Cadastrar cliente"}
        description={formMode === "edit" ? "Atualize os dados cadastrais e salve as alterações." : "Preencha os dados abaixo para adicionar um cliente."}
        onClose={closeForm}
        closeDisabled={saving}
        size="lg"
      >
        <form onSubmit={submitForm} noValidate>
          <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
            {formError && (
              <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p>{formError}</p>
              </div>
            )}

            <label className="block text-sm font-semibold text-slate-700">
              Nome completo <span className="text-rose-600">*</span>
              <input
                autoFocus
                type="text"
                value={form.nome}
                onChange={(event) => updateField("nome", event.target.value)}
                className={inputClass(Boolean(fieldErrors.nome))}
                placeholder="Ex.: Ana Souza"
                autoComplete="name"
                maxLength={120}
                aria-invalid={Boolean(fieldErrors.nome)}
              />
              {fieldErrors.nome && <span className="mt-1.5 block text-xs font-medium text-rose-600">{fieldErrors.nome}</span>}
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                CPF <span className="text-rose-600">*</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.cpf}
                  onChange={(event) => updateField("cpf", formatCpf(event.target.value))}
                  className={inputClass(Boolean(fieldErrors.cpf))}
                  placeholder="000.000.000-00"
                  autoComplete="off"
                  aria-invalid={Boolean(fieldErrors.cpf)}
                />
                {fieldErrors.cpf && <span className="mt-1.5 block text-xs font-medium text-rose-600">{fieldErrors.cpf}</span>}
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Telefone <span className="text-rose-600">*</span>
                <input
                  type="tel"
                  value={form.telefone}
                  onChange={(event) => updateField("telefone", formatPhone(event.target.value))}
                  className={inputClass(Boolean(fieldErrors.telefone))}
                  placeholder="(67) 99999-9999"
                  autoComplete="tel"
                  aria-invalid={Boolean(fieldErrors.telefone)}
                />
                {fieldErrors.telefone && <span className="mt-1.5 block text-xs font-medium text-rose-600">{fieldErrors.telefone}</span>}
              </label>
            </div>

            <label className="block text-sm font-semibold text-slate-700">
              E-mail <span className="font-normal text-slate-400">(opcional)</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className={inputClass(Boolean(fieldErrors.email))}
                placeholder="cliente@exemplo.com"
                autoComplete="email"
                maxLength={150}
                aria-invalid={Boolean(fieldErrors.email)}
              />
              {fieldErrors.email && <span className="mt-1.5 block text-xs font-medium text-rose-600">{fieldErrors.email}</span>}
            </label>

            <p className="text-xs leading-5 text-slate-400">
              Os campos marcados com * são obrigatórios. Os dados serão validados novamente pela API.
            </p>
          </div>

          <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-wait disabled:opacity-70"
            >
              {saving ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
              {saving ? "Salvando..." : formMode === "edit" ? "Salvar alterações" : "Cadastrar cliente"}
            </button>
          </footer>
        </form>
      </Modal>

      <Modal
        open={viewLoading || viewing !== null || viewError !== null}
        title="Detalhes do cliente"
        description="Dados cadastrais armazenados na API."
        onClose={() => {
          if (!viewLoading) {
            setViewing(null);
            setViewError(null);
          }
        }}
        closeDisabled={viewLoading}
      >
        <div className="px-5 py-6 sm:px-6">
          {viewLoading ? (
            <div className="grid min-h-48 place-items-center text-center text-sm text-slate-500">
              <div>
                <LoaderCircle className="mx-auto size-6 animate-spin text-teal-700" aria-hidden="true" />
                <p className="mt-3">Buscando dados do cliente...</p>
              </div>
            </div>
          ) : viewError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{viewError}</div>
          ) : viewing ? (
            <div>
              <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-teal-50 text-base font-bold text-teal-700">{personInitials(viewing.nome)}</span>
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-slate-950">{viewing.nome}</p>
                  <p className="mt-1 text-xs text-slate-500">Cliente #{viewing.id}</p>
                </div>
              </div>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <Detail icon={FileText} label="CPF" value={formatCpf(viewing.cpf)} />
                <Detail icon={Phone} label="Telefone" value={formatPhone(viewing.telefone)} />
                <Detail icon={Mail} label="E-mail" value={viewing.email || "Não informado"} />
                <Detail icon={CalendarDays} label="Data de cadastro" value={formatDate(viewing.dataCadastro)} />
              </dl>
              <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    const selected = viewing;
                    setViewing(null);
                    openEdit(selected);
                  }}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Editar cliente
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={deleteTarget !== null}
        title="Excluir cliente?"
        description="Esta ação remove o registro permanentemente."
        onClose={() => !deleting && setDeleteTarget(null)}
        closeDisabled={deleting}
        size="sm"
      >
        <div className="px-5 py-6 sm:px-6">
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-600">
              <Trash2 className="size-5" aria-hidden="true" />
            </span>
            <p className="text-sm leading-6 text-slate-600">
              Tem certeza que deseja excluir <strong className="text-slate-900">{deleteTarget?.nome}</strong>? O cadastro não poderá ser recuperado por esta tela.
            </p>
          </div>
        </div>
        <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            disabled={deleting}
            className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void confirmDelete()}
            disabled={deleting}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-wait disabled:opacity-70"
          >
            {deleting ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
            {deleting ? "Excluindo..." : "Excluir cliente"}
          </button>
        </footer>
      </Modal>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
      <dt className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-2 break-words text-sm font-medium text-slate-800">{value}</dd>
    </div>
  );
}
