"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listarClientes } from "@/services/clientes";
import { listarProdutos } from "@/services/produtos";
import { criarPedido } from "@/services/pedidos";
import type { Cliente } from "@/types/cliente";
import type { Produto } from "@/types/produto";
import type { PedidoRequest } from "@/types/pedido";

const inputClass = "mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-500";

export default function NovaOsPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clienteId, setClienteId] = useState(0);
  const [produtoId, setProdutoId] = useState(0);
  const [dataPrevisao, setDataPrevisao] = useState("");
  const [prioridade, setPrioridade] = useState<"NORMAL" | "URGENTE">("NORMAL");
  const [fields, setFields] = useState<Record<string, string>>({});
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

  const set = (key: string, value: string) => setFields((old) => ({ ...old, [key]: value }));
  const num = (key: string) => fields[key]?.trim() ? Number(fields[key].replace(",", ".")) : null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!clienteId) return setError("Selecione um cliente.");
    if (!produtoId) return setError("Selecione a lente ou serviço do catálogo.");
    setSaving(true); setError(null);
    const request: PedidoRequest = {
      clienteId,
      itens: [{ produtoId, quantidade: 1 }],
      dataPrevisao: dataPrevisao || null,
      prioridade,
      odEsferico: num("odEsferico"), odCilindrico: num("odCilindrico"), odEixo: num("odEixo"), odAdicao: num("odAdicao"), odDnp: num("odDnp"), odAltura: num("odAltura"),
      oeEsferico: num("oeEsferico"), oeCilindrico: num("oeCilindrico"), oeEixo: num("oeEixo"), oeAdicao: num("oeAdicao"), oeDnp: num("oeDnp"), oeAltura: num("oeAltura"),
      tipoLente: fields.tipoLente ?? "", materialLente: fields.materialLente ?? "", tratamento: fields.tratamento ?? "", armacao: fields.armacao ?? "", observacoes: fields.observacoes ?? "",
    };
    try {
      const created = await criarPedido(request);
      router.push(`/pedidos?os=${created.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível registrar a OS.");
    } finally { setSaving(false); }
  }

  return <div className="mx-auto w-full max-w-[1480px] space-y-5">
    <nav className="flex w-fit gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      <Link href="/pedidos" className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Ordens de serviço</Link>
      <Link href="/pedidos/nova-os" className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white">Registrar nova OS</Link>
    </nav>

    <section><p className="text-sm font-medium text-teal-700">Produção</p><h2 className="mt-1 text-2xl font-semibold text-slate-950 sm:text-[28px]">Registrar nova ordem de serviço</h2><p className="mt-2 text-sm text-slate-500">Cadastre cliente, receita e especificações técnicas do laboratório.</p></section>

    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      {error && <div className="mb-5 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-semibold text-slate-700">Cliente<select value={clienteId} onChange={(e) => setClienteId(Number(e.target.value))} className={inputClass}><option value={0}>Selecione</option>{clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
        <label className="text-sm font-semibold text-slate-700">Lente / serviço<select value={produtoId} onChange={(e) => setProdutoId(Number(e.target.value))} className={inputClass}><option value={0}>Selecione</option>{produtos.filter((p) => p.quantidadeEstoque > 0).map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
        <label className="text-sm font-semibold text-slate-700">Previsão<input type="date" value={dataPrevisao} onChange={(e) => setDataPrevisao(e.target.value)} className={inputClass} /></label>
        <label className="text-sm font-semibold text-slate-700">Prioridade<select value={prioridade} onChange={(e) => setPrioridade(e.target.value as "NORMAL" | "URGENTE")} className={inputClass}><option value="NORMAL">Normal</option><option value="URGENTE">Urgente</option></select></label>
      </div>

      <div className="mt-7 border-t border-slate-100 pt-6"><h3 className="font-semibold text-slate-900">Receita óptica</h3><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr className="text-left text-xs uppercase tracking-wider text-slate-500"><th className="pb-3">Olho</th>{["Esférico","Cilíndrico","Eixo","Adição","DNP","Altura"].map((x)=><th key={x} className="pb-3">{x}</th>)}</tr></thead><tbody>{["od","oe"].map((eye)=><tr key={eye} className="border-t border-slate-100"><td className="py-3 font-bold">{eye.toUpperCase()}</td>{["Esferico","Cilindrico","Eixo","Adicao","Dnp","Altura"].map((name)=><td key={name} className="py-3 pr-2"><input value={fields[`${eye}${name}`] ?? ""} onChange={(e)=>set(`${eye}${name}`,e.target.value)} className="h-10 w-full min-w-24 rounded-lg border border-slate-200 px-3" /></td>)}</tr>)}</tbody></table></div></div>

      <div className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-4">{[["tipoLente","Tipo de lente"],["materialLente","Material / índice"],["tratamento","Tratamento"],["armacao","Armação"]].map(([key,label])=><label key={key} className="text-sm font-semibold text-slate-700">{label}<input value={fields[key] ?? ""} onChange={(e)=>set(key,e.target.value)} className={inputClass} /></label>)}</div>
      <label className="mt-5 block text-sm font-semibold text-slate-700">Observações técnicas<textarea rows={4} value={fields.observacoes ?? ""} onChange={(e)=>set("observacoes",e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm" /></label>
      <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5"><Link href="/pedidos" className="inline-flex h-11 items-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700">Cancelar</Link><button disabled={saving} className="h-11 rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Registrando..." : "Registrar OS"}</button></div>
    </form>
  </div>;
}
