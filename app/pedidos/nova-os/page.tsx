"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { listarClientes } from "@/services/clientes";
import { listarProdutos } from "@/services/produtos";
import { criarPedido } from "@/services/pedidos";
import type { Cliente } from "@/types/cliente";
import type { Produto } from "@/types/produto";
import type { PedidoRequest } from "@/types/pedido";

const inputClass = "mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
const cardClass = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6";

const negociacoes = ["Venda", "Bonificação", "Consignação", "Demonstração", "Garantia", "Remessa para industrialização", "Transferência", "Venda virtual"];
const canais = ["Portador", "Balcão", "WhatsApp", "Telefone", "Web", "Representante"];
const familias = [
  "BF TOPO RETO INCOLOR",
  "LP POLI AR",
  "BF ULTEX FOTO",
  "BF ULTEX INCOLOR",
  "LP CR AR",
  "LP CR AR CILÍNDRICO ESPECIAL",
  "MF ESPACE ACCLIMATES III",
  "MF INCOLOR",
  "CR FOTO",
  "LP BLUE BLOCK RESIDUAL VERDE",
  "LP BLUE BLOCK RESIDUAL VERDE CIL. ESP.",
  "LP CR AR ESFÉRICO ESPECIAL",
  "LP CR INCOLOR",
];
const adicoes = ["", "0,75", "1,00", "1,25", "1,50", "1,75", "2,00", "2,25", "2,50", "2,75", "3,00", "3,25", "3,50"];
const etapas = ["Recebido", "Separação", "Surfaçagem", "Tratamento", "Corte", "Montagem", "CQ", "Expedição", "Entregue"];

type Eye = "od" | "oe";
type EyeField = "Esferico" | "Cilindrico" | "Eixo" | "Adicao" | "Dnp" | "Altura";

export default function NovaOsPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clienteId, setClienteId] = useState(0);
  const [produtoId, setProdutoId] = useState(0);
  const [servicos, setServicos] = useState<number[]>([]);
  const [dataPrevisao, setDataPrevisao] = useState("");
  const [prioridade, setPrioridade] = useState<"NORMAL" | "URGENTE">("NORMAL");
  const [fields, setFields] = useState<Record<string, string>>({ negociacao: "Venda", canalEntrada: "Portador" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listarClientes({ page: 0, size: 100 }), listarProdutos({ page: 0, size: 100, ativo: true })])
      .then(([c, p]) => {
        setClientes(c.content);
        setProdutos(p.content);
        setProdutoId(p.content.find((item) => item.quantidadeEstoque > 0)?.id ?? 0);
      })
      .catch(() => setError("Não foi possível carregar clientes e catálogo."));
  }, []);

  const produtoPrincipal = useMemo(() => produtos.find((p) => p.id === produtoId), [produtos, produtoId]);
  const set = (key: string, value: string) => setFields((old) => ({ ...old, [key]: value }));
  const num = (key: string) => fields[key]?.trim() ? Number(fields[key].replace(",", ".")) : null;

  function setEye(eye: Eye, key: EyeField, value: string) {
    let next = value.replace(/[^0-9,+\-.]/g, "");
    if (key === "Eixo") next = next.replace(/[^0-9]/g, "").slice(0, 3);
    set(`${eye}${key}`, next);
  }

  function toggleServico(id: number) {
    setServicos((old) => old.includes(id) ? old.filter((item) => item !== id) : [...old, id]);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!clienteId) return setError("Selecione um cliente.");
    if (!produtoId) return setError("Selecione a lente principal da OS.");

    const itens = [produtoId, ...servicos.filter((id) => id !== produtoId)].map((id) => ({ produtoId: id, quantidade: 1 }));
    const observacoesOperacionais = [
      fields.nomePaciente && `Paciente: ${fields.nomePaciente}`,
      fields.nomeMedico && `Médico: ${fields.nomeMedico}${fields.crm ? ` / CRM ${fields.crm}` : ""}`,
      `Negociação: ${fields.negociacao || "Venda"}`,
      `Canal de entrada: ${fields.canalEntrada || "Portador"}`,
      fields.familiaOD && `Família OD: ${fields.familiaOD}`,
      fields.familiaOE && `Família OE: ${fields.familiaOE}`,
      fields.blocoFornecido === "sim" && "Bloco fornecido pelo cliente",
      fields.observacoes,
    ].filter(Boolean).join(" | ");

    setSaving(true);
    setError(null);
    const request: PedidoRequest = {
      clienteId,
      itens,
      dataPrevisao: dataPrevisao || null,
      prioridade,
      odEsferico: num("odEsferico"), odCilindrico: num("odCilindrico"), odEixo: num("odEixo"), odAdicao: num("odAdicao"), odDnp: num("odDnp"), odAltura: num("odAltura"),
      oeEsferico: num("oeEsferico"), oeCilindrico: num("oeCilindrico"), oeEixo: num("oeEixo"), oeAdicao: num("oeAdicao"), oeDnp: num("oeDnp"), oeAltura: num("oeAltura"),
      tipoLente: fields.tipoLente || produtoPrincipal?.nome || "",
      materialLente: fields.materialLente ?? "",
      tratamento: fields.tratamento ?? "",
      armacao: fields.armacao ?? "",
      observacoes: observacoesOperacionais,
    };

    try {
      const created = await criarPedido(request);
      router.push(`/pedidos?os=${created.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível registrar a OS.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="mx-auto w-full max-w-[1500px] space-y-5">
    <nav className="flex w-fit gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      <Link href="/pedidos" className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Ordens de serviço</Link>
      <Link href="/pedidos/nova-os" className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white">Registrar nova OS</Link>
    </nav>

    <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div><p className="text-sm font-medium text-teal-700">Laboratório óptico</p><h2 className="mt-1 text-2xl font-semibold text-slate-950 sm:text-[28px]">Registrar nova ordem de serviço</h2><p className="mt-2 text-sm text-slate-500">Pedido, receita, lentes, serviços e montagem em um único fluxo.</p></div>
      <div className="flex flex-wrap gap-2">{etapas.map((etapa, index) => <span key={etapa} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${index === 0 ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-500"}`}>{index + 1}. {etapa}</span>)}</div>
    </section>

    <form onSubmit={submit} className="space-y-5">
      {error && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}

      <section className={cardClass}>
        <div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold text-slate-950">Dados do pedido</h3><p className="mt-1 text-sm text-slate-500">Identificação comercial e origem da OS.</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Status inicial: Recebido</span></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-semibold text-slate-700">Cliente<select value={clienteId} onChange={(e) => setClienteId(Number(e.target.value))} className={inputClass}><option value={0}>Selecione</option>{clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
          <label className="text-sm font-semibold text-slate-700">Nome do paciente<input value={fields.nomePaciente ?? ""} onChange={(e) => set("nomePaciente", e.target.value)} className={inputClass} placeholder="Opcional" /></label>
          <label className="text-sm font-semibold text-slate-700">Nome do médico<input value={fields.nomeMedico ?? ""} onChange={(e) => set("nomeMedico", e.target.value)} className={inputClass} placeholder="Opcional" /></label>
          <label className="text-sm font-semibold text-slate-700">CRM<input value={fields.crm ?? ""} onChange={(e) => set("crm", e.target.value)} className={inputClass} /></label>
          <label className="text-sm font-semibold text-slate-700">Negociação<select value={fields.negociacao} onChange={(e) => set("negociacao", e.target.value)} className={inputClass}>{negociacoes.map((n) => <option key={n}>{n}</option>)}</select></label>
          <label className="text-sm font-semibold text-slate-700">Canal de entrada<select value={fields.canalEntrada} onChange={(e) => set("canalEntrada", e.target.value)} className={inputClass}>{canais.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="text-sm font-semibold text-slate-700">Previsão<input type="date" value={dataPrevisao} onChange={(e) => setDataPrevisao(e.target.value)} className={inputClass} /></label>
          <label className="text-sm font-semibold text-slate-700">Prioridade<select value={prioridade} onChange={(e) => setPrioridade(e.target.value as "NORMAL" | "URGENTE")} className={inputClass}><option value="NORMAL">Normal</option><option value="URGENTE">Urgente</option></select></label>
        </div>
      </section>

      <section className={cardClass}>
        <div><h3 className="font-semibold text-slate-950">Receita óptica</h3><p className="mt-1 text-sm text-slate-500">Longe, adição e dados de montagem separados por olho.</p></div>
        <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[820px] text-sm"><thead><tr className="text-left text-xs uppercase tracking-wider text-slate-500"><th className="pb-3">Olho</th>{["Esférico", "Cilíndrico", "Eixo", "Adição", "DNP", "Altura"].map((x) => <th key={x} className="pb-3 pr-2">{x}</th>)}</tr></thead><tbody>{(["od", "oe"] as Eye[]).map((eye) => <tr key={eye} className="border-t border-slate-100"><td className="py-3 font-bold text-slate-900">{eye.toUpperCase()}</td>{(["Esferico", "Cilindrico", "Eixo", "Adicao", "Dnp", "Altura"] as EyeField[]).map((name) => <td key={name} className="py-3 pr-2">{name === "Adicao" ? <select value={fields[`${eye}${name}`] ?? ""} onChange={(e) => setEye(eye, name, e.target.value)} className="h-10 w-full min-w-24 rounded-lg border border-slate-200 bg-white px-2"><option value="">—</option>{adicoes.filter(Boolean).map((v) => <option key={v} value={v}>{v}</option>)}</select> : <input value={fields[`${eye}${name}`] ?? ""} onChange={(e) => setEye(eye, name, e.target.value)} inputMode="decimal" className="h-10 w-full min-w-24 rounded-lg border border-slate-200 px-3 outline-none focus:border-teal-500" />}</td>)}</tr>)}</tbody></table></div>
        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600">Campos de adição usam valores padronizados. Eixo aceita de 0 a 180 e será validado pela API.</div>
      </section>

      <section className={cardClass}>
        <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
          <div><h3 className="font-semibold text-slate-950">Lentes e famílias</h3><p className="mt-1 text-sm text-slate-500">Selecione a lente principal e a família comercial de cada olho.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Lente principal<select value={produtoId} onChange={(e) => setProdutoId(Number(e.target.value))} className={inputClass}><option value={0}>Selecione</option>{produtos.filter((p) => p.quantidadeEstoque > 0).map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
              <label className="text-sm font-semibold text-slate-700">Família OD<select value={fields.familiaOD ?? ""} onChange={(e) => set("familiaOD", e.target.value)} className={inputClass}><option value="">Selecione</option>{familias.map((f) => <option key={f}>{f}</option>)}</select></label>
              <label className="text-sm font-semibold text-slate-700">Família OE<select value={fields.familiaOE ?? ""} onChange={(e) => set("familiaOE", e.target.value)} className={inputClass}><option value="">Selecione</option>{familias.map((f) => <option key={f}>{f}</option>)}</select></label>
              <label className="text-sm font-semibold text-slate-700">Material / índice<input value={fields.materialLente ?? ""} onChange={(e) => set("materialLente", e.target.value)} className={inputClass} placeholder="CR-39, 1.56, 1.60..." /></label>
              <label className="text-sm font-semibold text-slate-700">Tratamento<input value={fields.tratamento ?? ""} onChange={(e) => set("tratamento", e.target.value)} className={inputClass} placeholder="AR, Blue Block, Foto..." /></label>
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={fields.blocoFornecido === "sim"} onChange={(e) => set("blocoFornecido", e.target.checked ? "sim" : "")} className="h-4 w-4 rounded border-slate-300" />Bloco fornecido pelo cliente</label>
          </div>

          <div><h3 className="font-semibold text-slate-950">Dados da armação</h3><p className="mt-1 text-sm text-slate-500">Informações úteis para corte e montagem.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[["armacao", "Armação / modelo"], ["ponte", "Ponte"], ["aro", "Aro"], ["maior", "Maior diagonal"], ["distHastes", "Dist. entre hastes"], ["distFrontal", "Distância frontal"], ["curvatura", "Curvatura"], ["formatoAro", "Formato do aro"]].map(([key, label]) => <label key={key} className="text-sm font-semibold text-slate-700">{label}<input value={fields[key] ?? ""} onChange={(e) => set(key, e.target.value)} className={inputClass} /></label>)}
            </div>
          </div>
        </div>
      </section>

      <section className={cardClass}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h3 className="font-semibold text-slate-950">Serviços do pedido</h3><p className="mt-1 text-sm text-slate-500">Uma OS pode ter vários serviços além da lente principal.</p></div><span className="text-sm font-semibold text-teal-700">{servicos.length} selecionado(s)</span></div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{produtos.filter((p) => p.id !== produtoId).slice(0, 24).map((p) => <label key={p.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm transition ${servicos.includes(p.id) ? "border-teal-300 bg-teal-50 text-teal-900" : "border-slate-200 hover:bg-slate-50"}`}><input type="checkbox" checked={servicos.includes(p.id)} onChange={() => toggleServico(p.id)} className="h-4 w-4 rounded border-slate-300" /><span className="font-medium">{p.nome}</span></label>)}</div>
      </section>

      <section className={cardClass}>
        <h3 className="font-semibold text-slate-950">Observações técnicas</h3><textarea rows={4} value={fields.observacoes ?? ""} onChange={(e) => set("observacoes", e.target.value)} className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-teal-500" placeholder="Gravação, cor, montagem, garantia, particularidades da lente ou da armação..." />
        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5"><Link href="/pedidos" className="inline-flex h-11 items-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700">Cancelar</Link><button disabled={saving} className="h-11 rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Registrando..." : "Registrar OS"}</button></div>
      </section>
    </form>
  </div>;
}
