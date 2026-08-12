import { apiRequest, queryString } from "@/services/api";
import { DEMO_MODE } from "@/services/config";
import { demoPedidosService } from "@/services/demo-pedidos";
import type { PaginaResponse } from "@/types/api";
import type { Pedido, PedidoListagemParams, PedidoRequest, StatusPedido } from "@/types/pedido";

export function listarPedidos(params: PedidoListagemParams = {}) {
  if (DEMO_MODE) return demoPedidosService.listar(params);
  return apiRequest<PaginaResponse<Pedido>>(`/pedidos${queryString({ status: params.status, cliente: params.cliente, page: params.page ?? 0, size: params.size ?? 10, sort: params.sort ?? "dataPedido,desc" })}`);
}
export function buscarPedido(id: number) { if (DEMO_MODE) return demoPedidosService.buscar(id); return apiRequest<Pedido>(`/pedidos/${id}`); }
export function criarPedido(request: PedidoRequest) { if (DEMO_MODE) return demoPedidosService.criar(request); return apiRequest<Pedido>("/pedidos", { method: "POST", body: JSON.stringify(request) }); }
export function atualizarStatusPedido(id: number, status: StatusPedido) { if (DEMO_MODE) return demoPedidosService.atualizarStatus(id, status); return apiRequest<Pedido>(`/pedidos/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }); }
export function excluirPedido(id: number) { if (DEMO_MODE) return demoPedidosService.excluir(id); return apiRequest<void>(`/pedidos/${id}`, { method: "DELETE" }); }
export function resetarPedidosDemo() { return demoPedidosService.resetar(); }
