"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { listarClientes } from "@/services/clientes";
import { listarProdutos } from "@/services/produtos";
import { criarPedido } from "@/services/pedidos";
import { listarFamiliasLente, listarServicosLaboratorio } from "@/services/catalogo";
import type { Cliente } from "@/types/cliente";
import type { Produto } from "@/types/produto";
import type { FamiliaLente, ServicoLaboratorio } from "@/types/catalogo";
import type { PedidoRequest } from "@/types/pedido";

const inputClass = "mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
const cardClass = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6";
const negociacoes = ["Venda", "Bonificação", "Consignação", "Demonstração", "Garantia", "Remessa para industrialização", "Transferência", "Venda virtual"];
const canais = ["Portador", "Balcão", "WhatsApp", "Telefone", "Web", "Representante"];
const adicoes = ["", "0,75", "1,00", "1,25", "1,50", "1,75", "2,00", "2,25", "2,50", "2,75", "3,00", "3,25", "3,50"];
const etapas = ["Recebido", "Separação", "Surfaçagem", "Tratamento", "Corte", "Montagem", "CQ", "Expedição", "Entregue"];

const familiasFallback: FamiliaLente[] = [
  [1,"BF-TRI","BF TOPO RETO INCOLOR","CR-39","Bifocal","Incolor"],
  [2,"LP-POLI-AR","LP POLI AR","Policarbonato","Visão simples","AR"],
  [3,"BF-ULTEX-FOTO","BF ULTEX FOTO","CR-39","Bifocal","Fotossensível"],
  [4,"MF-ESPACE","MF ESPACE ACCLIMATES III","1.56","Multifocal","AR"],
  [5,"LP-BLUE","LP BLUE BLOCK RESIDUAL VERDE","1.56","Visão simples","Blue Block"],
].map(([id,codigo,descricao,material,tecnologia,tratamentoPadrao]) => ({ id:id as number, codigo:codigo as string, descricao:descricao as string, material:material as string, tecnologia:tecnologia as string, tratamentoPadrao:tratamentoPadrao as string, precoBase:0, ativo:true }));

const servicosFallback: ServicoLaboratorio[] = [
  [1,"MONT","Montagem","Montagem"],[2,"CORTE","Corte / facetamento","Corte"],[3,"AR","Aplicação antirreflexo","Tratamento"],
  [4,"COLOR","Coloração","Coloração"],[5,"UV","Tratamento UV","Tratamento"],[6,"GRAV","Gravação","Gravação"],[7,"PARAF","Montagem parafusada","Montagem"]
].map(([id,codigo,descricao,setor]) => ({ id:id as number, codigo:codigo as string, descricao:descricao as string, setor:setor as string, preco:0, ativo:true }));

type Eye = "od" | "oe";
type EyeField = "Esferico" | "Cilindrico" | "Eixo" | "Adicao" | "Dnp" | "Altura";

export default function NovaOsPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [familias, setFamilias] = useState<FamiliaLente[]>([]);
  const [catalogoServicos, setCatalogoServicos] = useState<ServicoLaboratorio[]>([]);
  const [clienteId, setClienteId] = useState(0);
  const [produtoId, setProdutoId] = useState(0);
  const [familiaOD, setFamiliaOD] = useState(0);
  const [familiaOE, setFamiliaOE] = useState(0);
  const [servicos, setServicos] = useState<number[]>([]);
  const [dataPrevisao, setDataPrevisao] = useState("");
  const [prioridade, setPrioridade] = useState<"NORMAL" | "URGENTE">("NORMAL");
  const [fields, setFields] = useState<Record<string, string>>({ negociacao:"Venda", canalEntrada:"Portador" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      listarClientes({ page:0, size:100 }),
      listarProdutos({ page:0, size:100, ativo:true }),
      listarFamiliasLente().catch(() => familiasFallback),
      listarServicosLaboratorio().catch(() => servicosFallback),
    ]).then(([c,p,f,s]) => {
      setClientes(c.content); setProdutos(p.content); setFamilias(f.length ? f : familiasFallback); setCatalogoServicos(s.length ? s : servicosFallback);
      setProdutoId(p.content.find((item) => item.quantidadeEstoque > 0)?.id ?? 0);
    }).catch(() => setError("Não foi possível carregar clientes e catálogo."));
  }, []);

  const produtoPrincipal = useMemo(() => produtos.find((p) => p.id === produtoId), [produtos, produtoId]);
  const familiaOdData = useMemo(() => familias.find((f) => f.id === familiaOD), [familias, familiaOD]);
  const familiaOeData = useMemo(() => familias.find((f) => f.id === familiaOE), [familias, familiaOE]);
  const valorServicos = useMemo(() => catalogoServicos.filter((s) => servicos.includes(s.id)).reduce((acc,s) => acc + (s.preco ?? 0), 0), [catalogoServicos, servicos]);
  const set = (key:string,value:string) => setFields((old) => ({...old,[key]:value}));
  const num = (key:string) => fields[key]?.trim() ? Number(fields[key].replace(",",".")) : null;

  function setEye(eye:Eye,key:EyeField,value:string) {
    let next=value.replace(/[^0-9,+\-.]/g,"");
    if (key === "Eixo") next=next.replace(/[^0-9]/g,"").slice(0,3);
    set(`${eye}${key}`,next);
  }
  function toggleServico(id:number) { setServicos((old) => old.includes(id) ? old.filter((x) => x !== id) : [...old,id]); }

  async function submit(event:FormEvent) {
    event.preventDefault();
    if (!clienteId) return setError("Selecione um cliente.");
    if (!produtoId) return setError("Selecione a lente/produto principal da OS.");
    const observacoesOperacionais = [
      fields.nomePaciente && `Paciente: ${fields.nomePaciente}`,
      fields.nomeMedico && `Médico: ${fields.nomeMedico}${fields.crm ? ` / CRM ${fields.crm}` : ""}`,
      `Negociação: ${fields.negociacao || "Venda"}`, `Canal: ${fields.canalEntrada || "Portador"}`, fields.armacao && `Armação: ${fields.armacao}`,
      fields.observacoes,
    ].filter(Boolean).join(" | ");

    const request:PedidoRequest = {
      clienteId, itens:[{ produtoId, quantidade:1 }], dataPrevisao:dataPrevisao || null, prioridade,
      lentes:[
        ...(familiaOD ? [{ olho:"OD" as const, familiaLenteId:familiaOD, preco:familiaOdData?.precoBase ?? null, blocoFornecido:fields.blocoFornecido === "sim" }] : []),
        ...(familiaOE ? [{ olho:"OE" as const, familiaLenteId:familiaOE, preco:familiaOeData?.precoBase ?? null, blocoFornecido:fields.blocoFornecido === "sim" }] : []),
      ],
      servicos:catalogoServicos.filter((s) => servicos.includes(s.id)).map((s) => ({ servicoId:s.id, quantidade:1, precoUnitario:s.preco ?? null })),
      odEsferico:num("odEsferico"), odCilindrico:num("odCilindrico"), odEixo:num("odEixo"), odAdicao:num("odAdicao"), odDnp:num("odDnp"), odAltura:num("odAltura"),
      oeEsferico:num("oeEsferico"), oeCilindrico:num("oeCilindrico"), oeEixo:num("oeEixo"), oeAdicao:num("oeAdicao"), oeDnp:num("oeDnp"), oeAltura:num("oeAltura"),
      tipoLente:familiaOdData?.descricao || familiaOeData?.descricao || produtoPrincipal?.nome || "", materialLente:fields.materialLente || familiaOdData?.material || familiaOeData?.material || "",
      tratamento:fields.tratamento || familiaOdData?.tratamentoPadrao || familiaOeData?.tratamentoPadrao || "", armacao:fields.armacao ?? "", observacoes:observacoesOperacionais,
    };
    setSaving(true); setError(null);
    try { const created=await criarPedido(request); router.push(`/pedidos?os=${created.id}`); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível registrar a OS."); }
    finally { setSaving(false); }
  }

  return <div className="mx-auto w-full max-w-[1500px] space-y-5">
    <nav className="flex w-fit gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      <Link href="/pedidos" className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Ordens de serviço</Link>
      <Link href="/pedidos/nova-os" className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white">Registrar nova OS</Link>
    </nav>

    <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div><p className="text-sm font-medium text-teal-700">Laboratório óptico</p><h2 className="mt-1 text-2xl font-semibold text-slate-950 sm:text-[28px]">Registrar nova ordem de serviço</h2><p className="mt-2 text-sm text-slate-500">A interface completa, agora integrada aos catálogos e ao fluxo produtivo.</p></div>
      <div className="flex max-w-3xl flex-wrap gap-2">{etapas.map((etapa,index)=><span key={etapa} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${index===0?"bg-teal-700 text-white":"bg-slate-100 text-slate-500"}`}>{index+1}. {etapa}</span>)}</div>
    </section>

    <form onSubmit={submit} className="space-y-5">
      {error && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}

      <section className={cardClass}>
        <div className="flex items-center justify-between"><div><h3 className="font-semibold text-slate-950">Dados do pedido</h3><p className="mt-1 text-sm text-slate-500">Cliente, paciente, médico e informações comerciais.</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Recebido</span></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-semibold text-slate-700">Cliente<select value={clienteId} onChange={(e)=>setClienteId(Number(e.target.value))} className={inputClass}><option value={0}>Selecione</option>{clientes.map((c)=><option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
          <label className="text-sm font-semibold text-slate-700">Paciente<input value={fields.nomePaciente??""} onChange={(e)=>set("nomePaciente",e.target.value)} className={inputClass}/></label>
          <label className="text-sm font-semibold text-slate-700">Médico<input value={fields.nomeMedico??""} onChange={(e)=>set("nomeMedico",e.target.value)} className={inputClass}/></label>
          <label className="text-sm font-semibold text-slate-700">CRM<input value={fields.crm??""} onChange={(e)=>set("crm",e.target.value)} className={inputClass}/></label>
          <label className="text-sm font-semibold text-slate-700">Negociação<select value={fields.negociacao} onChange={(e)=>set("negociacao",e.target.value)} className={inputClass}>{negociacoes.map((n)=><option key={n}>{n}</option>)}</select></label>
          <label className="text-sm font-semibold text-slate-700">Canal<select value={fields.canalEntrada} onChange={(e)=>set("canalEntrada",e.target.value)} className={inputClass}>{canais.map((c)=><option key={c}>{c}</option>)}</select></label>
          <label className="text-sm font-semibold text-slate-700">Previsão<input type="date" value={dataPrevisao} onChange={(e)=>setDataPrevisao(e.target.value)} className={inputClass}/></label>
          <label className="text-sm font-semibold text-slate-700">Prioridade<select value={prioridade} onChange={(e)=>setPrioridade(e.target.value as "NORMAL"|"URGENTE")} className={inputClass}><option value="NORMAL">Normal</option><option value="URGENTE">Urgente</option></select></label>
        </div>
      </section>

      <section className={cardClass}>
        <h3 className="font-semibold text-slate-950">Receita óptica</h3><p className="mt-1 text-sm text-slate-500">OD e OE separados para evitar ambiguidade na produção.</p>
        <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[820px] text-sm"><thead><tr className="text-left text-xs uppercase tracking-wider text-slate-500"><th className="pb-3">Olho</th>{["Esférico","Cilíndrico","Eixo","Adição","DNP","Altura"].map((x)=><th key={x} className="pb-3 pr-2">{x}</th>)}</tr></thead><tbody>{(["od","oe"] as Eye[]).map((eye)=><tr key={eye} className="border-t border-slate-100"><td className="py-3 font-bold">{eye.toUpperCase()}</td>{(["Esferico","Cilindrico","Eixo","Adicao","Dnp","Altura"] as EyeField[]).map((name)=><td key={name} className="py-3 pr-2">{name==="Adicao"?<select value={fields[`${eye}${name}`]??""} onChange={(e)=>setEye(eye,name,e.target.value)} className="h-10 w-full min-w-24 rounded-lg border border-slate-200 bg-white px-2"><option value="">—</option>{adicoes.filter(Boolean).map((v)=><option key={v} value={v}>{v}</option>)}</select>:<input value={fields[`${eye}${name}`]??""} onChange={(e)=>setEye(eye,name,e.target.value)} className="h-10 w-full min-w-24 rounded-lg border border-slate-200 px-3 outline-none focus:border-teal-500"/>}</td>)}</tr>)}</tbody></table></div>
      </section>

      <section className={cardClass}>
        <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
          <div><h3 className="font-semibold text-slate-950">Lentes e famílias</h3><p className="mt-1 text-sm text-slate-500">Famílias vêm do catálogo técnico do laboratório.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Produto principal<select value={produtoId} onChange={(e)=>setProdutoId(Number(e.target.value))} className={inputClass}><option value={0}>Selecione</option>{produtos.filter((p)=>p.quantidadeEstoque>0).map((p)=><option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
              <label className="text-sm font-semibold text-slate-700">Família OD<select value={familiaOD} onChange={(e)=>setFamiliaOD(Number(e.target.value))} className={inputClass}><option value={0}>Selecione</option>{familias.map((f)=><option key={f.id} value={f.id}>{f.codigo} · {f.descricao}</option>)}</select></label>
              <label className="text-sm font-semibold text-slate-700">Família OE<select value={familiaOE} onChange={(e)=>setFamiliaOE(Number(e.target.value))} className={inputClass}><option value={0}>Selecione</option>{familias.map((f)=><option key={f.id} value={f.id}>{f.codigo} · {f.descricao}</option>)}</select></label>
              <label className="text-sm font-semibold text-slate-700">Material / índice<input value={fields.materialLente??""} onChange={(e)=>set("materialLente",e.target.value)} className={inputClass} placeholder={familiaOdData?.material || "CR-39, 1.56, 1.60..."}/></label>
              <label className="text-sm font-semibold text-slate-700">Tratamento<input value={fields.tratamento??""} onChange={(e)=>set("tratamento",e.target.value)} className={inputClass} placeholder={familiaOdData?.tratamentoPadrao || "AR, Blue Block, Foto..."}/></label>
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={fields.blocoFornecido==="sim"} onChange={(e)=>set("blocoFornecido",e.target.checked?"sim":"")}/> Bloco/lente fornecido pelo cliente</label>
          </div>
          <div className="rounded-2xl bg-slate-950 p-5 text-white"><p className="text-xs font-semibold uppercase tracking-[.18em] text-teal-300">Resumo técnico</p><div className="mt-4 space-y-3 text-sm"><p><span className="text-slate-400">OD</span><br/>{familiaOdData?.descricao || "Não selecionada"}</p><p><span className="text-slate-400">OE</span><br/>{familiaOeData?.descricao || "Não selecionada"}</p><p><span className="text-slate-400">Tecnologia</span><br/>{familiaOdData?.tecnologia || familiaOeData?.tecnologia || "—"}</p></div></div>
        </div>
      </section>

      <section className={cardClass}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-semibold text-slate-950">Serviços do pedido</h3><p className="mt-1 text-sm text-slate-500">Serviços independentes do produto, com setor e preço próprios.</p></div><span className="text-sm font-bold text-teal-700">Selecionados: {servicos.length} · R$ {valorServicos.toFixed(2).replace(".",",")}</span></div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{catalogoServicos.map((s)=>{const active=servicos.includes(s.id);return <button type="button" key={s.id} onClick={()=>toggleServico(s.id)} className={`rounded-xl border p-4 text-left transition ${active?"border-teal-500 bg-teal-50 ring-2 ring-teal-100":"border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-teal-700">{s.codigo}</p><p className="mt-1 text-sm font-semibold text-slate-900">{s.descricao}</p><p className="mt-1 text-xs text-slate-500">{s.setor || "Serviço geral"}</p></div><span className={`mt-1 grid h-5 w-5 place-items-center rounded-full border text-xs ${active?"border-teal-600 bg-teal-600 text-white":"border-slate-300"}`}>{active?"✓":""}</span></div></button>})}</div>
      </section>

      <section className={cardClass}>
        <h3 className="font-semibold text-slate-950">Armação e observações</h3><div className="mt-4 grid gap-4 lg:grid-cols-3"><label className="text-sm font-semibold text-slate-700">Armação<input value={fields.armacao??""} onChange={(e)=>set("armacao",e.target.value)} className={inputClass} placeholder="Marca / modelo / referência"/></label><label className="text-sm font-semibold text-slate-700 lg:col-span-2">Observações<input value={fields.observacoes??""} onChange={(e)=>set("observacoes",e.target.value)} className={inputClass} placeholder="Informações para produção, CQ ou expedição"/></label></div>
      </section>

      <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-slate-900">OS pronta para registrar</p><p className="text-xs text-slate-500">Receita + lentes + serviços + dados operacionais serão enviados juntos.</p></div><div className="flex gap-2"><Link href="/pedidos" className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Cancelar</Link><button disabled={saving} className="rounded-xl bg-teal-700 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-teal-800 disabled:opacity-60">{saving?"Registrando...":"Registrar ordem de serviço"}</button></div></div>
    </form>
  </div>;
}
