import type { Pedido } from "@/types/pedido";

export interface DashboardResumo {
  totalClientes: number;
  totalPedidos: number;
  pedidosEmProducao: number;
  pedidosProntos: number;
  produtosCadastrados: number;
  produtosEstoqueBaixo: number;
  pedidosRecentes: Pedido[];
}
