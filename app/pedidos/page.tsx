import Link from "next/link";
import { PedidosPage } from "@/components/pedidos/pedidos-page";

export default function Page() {
  return (
    <div className="space-y-5">
      <nav className="flex w-fit gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm" aria-label="Navegação de pedidos">
        <Link
          href="/pedidos"
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Ordens de serviço
        </Link>
        <Link
          href="/pedidos/nova-os"
          className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
        >
          Registrar nova OS
        </Link>
      </nav>
      <PedidosPage />
    </div>
  );
}
