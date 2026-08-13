import Link from "next/link";

export default function NovaOsPage() {
  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-5">
      <nav className="flex w-fit gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm" aria-label="Navegação de pedidos">
        <Link
          href="/pedidos"
          className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
        >
          Ordens de serviço
        </Link>
        <Link
          href="/pedidos/nova-os"
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Registrar nova OS
        </Link>
      </nav>

      <section>
        <p className="text-sm font-medium text-teal-700">Produção</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-[28px]">
          Registrar nova ordem de serviço
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Cadastre os dados do cliente, receita óptica e especificações técnicas do serviço.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-slate-700">Cliente</label>
            <div className="mt-2 h-11 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Seleção de cliente será conectada ao cadastro existente
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700">Previsão de entrega</label>
            <input type="date" className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" />
          </div>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-6">
          <h3 className="text-base font-semibold text-slate-900">Receita óptica</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="pb-3">Olho</th><th className="pb-3">Esférico</th><th className="pb-3">Cilíndrico</th><th className="pb-3">Eixo</th><th className="pb-3">Adição</th><th className="pb-3">DNP</th><th className="pb-3">Altura</th>
                </tr>
              </thead>
              <tbody>
                {["OD", "OE"].map((olho) => (
                  <tr key={olho} className="border-t border-slate-100">
                    <td className="py-3 font-bold text-slate-800">{olho}</td>
                    {["esferico", "cilindrico", "eixo", "adicao", "dnp", "altura"].map((campo) => (
                      <td key={campo} className="py-3 pr-2"><input aria-label={`${olho} ${campo}`} className="h-10 w-full min-w-24 rounded-lg border border-slate-200 px-3" /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Tipo de lente", "Ex.: Progressiva"],
            ["Material / índice", "Ex.: 1.67"],
            ["Tratamento", "Ex.: Antirreflexo"],
            ["Armação", "Modelo / referência"],
          ].map(([label, placeholder]) => (
            <label key={label} className="text-sm font-semibold text-slate-700">{label}<input placeholder={placeholder} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal" /></label>
          ))}
        </div>

        <label className="mt-5 block text-sm font-semibold text-slate-700">Observações técnicas<textarea rows={4} className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal" placeholder="Informações importantes para produção, montagem e conferência..." /></label>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
          <Link href="/pedidos" className="inline-flex h-11 items-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700">Cancelar</Link>
          <button type="button" className="h-11 rounded-xl bg-teal-700 px-5 text-sm font-semibold text-white hover:bg-teal-800">Registrar OS</button>
        </div>
      </section>
    </div>
  );
}
