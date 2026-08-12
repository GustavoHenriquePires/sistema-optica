import { apiRequest } from "@/services/api";
import { listarClientes } from "@/services/clientes";
import { DEMO_MODE } from "@/services/config";
import { listarPedidos } from "@/services/pedidos";
import { listarProdutos } from "@/services/produtos";
import type { DashboardResumo } from "@/types/dashboard";

export async function obterDashboard(): Promise<DashboardResumo> {
  if (!DEMO_MODE) return apiRequest<DashboardResumo>("/dashboard");
  const [clientes, pedidos, producao, prontos, produtos] = await Promise.all([
    listarClientes({ page: 0, size: 1 }), listarPedidos({ page: 0, size: 5 }), listarPedidos({ status: "EM_PRODUCAO", page: 0, size: 1 }), listarPedidos({ status: "PRONTO", page: 0, size: 1 }), listarProdutos({ page: 0, size: 100, ativo: true }),
  ]);
  return { totalClientes: clientes.totalElements, totalPedidos: pedidos.totalElements, pedidosEmProducao: producao.totalElements, pedidosProntos: prontos.totalElements, produtosCadastrados: produtos.totalElements, produtosEstoqueBaixo: produtos.content.filter((item) => item.quantidadeEstoque <= 5).length, pedidosRecentes: pedidos.content };
}
