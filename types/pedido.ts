import type { Cliente } from "@/types/cliente";

export type StatusPedido = "RECEBIDO" | "EM_PRODUCAO" | "PRONTO" | "ENTREGUE" | "CANCELADO";

export interface ItemPedido {
  id: number;
  produtoId: number;
  produtoNome: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

export interface Pedido {
  id: number;
  cliente: Cliente;
  itens: ItemPedido[];
  valorTotal: number;
  status: StatusPedido;
  dataPedido: string;
  dataPrevisao: string | null;
  observacoes: string | null;
}

export interface PedidoRequest {
  clienteId: number;
  itens: Array<{ produtoId: number; quantidade: number }>;
  dataPrevisao: string | null;
  observacoes: string;
}

export interface PedidoListagemParams {
  status?: StatusPedido | "";
  cliente?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export const statusLabels: Record<StatusPedido, string> = {
  RECEBIDO: "Recebido",
  EM_PRODUCAO: "Em produção",
  PRONTO: "Pronto",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

export const nextStatus: Partial<Record<StatusPedido, StatusPedido>> = {
  RECEBIDO: "EM_PRODUCAO",
  EM_PRODUCAO: "PRONTO",
  PRONTO: "ENTREGUE",
};
