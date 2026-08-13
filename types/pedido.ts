import type { Cliente } from "@/types/cliente";

export type StatusPedido = "RECEBIDO" | "EM_PRODUCAO" | "PRONTO" | "ENTREGUE" | "CANCELADO";
export type PrioridadeOrdemServico = "NORMAL" | "URGENTE";

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
  numeroOs?: string;
  cliente: Cliente;
  itens: ItemPedido[];
  valorTotal: number;
  status: StatusPedido;
  prioridade?: PrioridadeOrdemServico;
  dataPedido: string;
  dataPrevisao: string | null;
  odEsferico?: number | null;
  odCilindrico?: number | null;
  odEixo?: number | null;
  odAdicao?: number | null;
  odDnp?: number | null;
  odAltura?: number | null;
  oeEsferico?: number | null;
  oeCilindrico?: number | null;
  oeEixo?: number | null;
  oeAdicao?: number | null;
  oeDnp?: number | null;
  oeAltura?: number | null;
  tipoLente?: string | null;
  materialLente?: string | null;
  tratamento?: string | null;
  armacao?: string | null;
  observacoes: string | null;
}

export interface PedidoRequest {
  clienteId: number;
  itens: Array<{ produtoId: number; quantidade: number }>;
  dataPrevisao: string | null;
  prioridade?: PrioridadeOrdemServico;
  odEsferico?: number | null;
  odCilindrico?: number | null;
  odEixo?: number | null;
  odAdicao?: number | null;
  odDnp?: number | null;
  odAltura?: number | null;
  oeEsferico?: number | null;
  oeCilindrico?: number | null;
  oeEixo?: number | null;
  oeAdicao?: number | null;
  oeDnp?: number | null;
  oeAltura?: number | null;
  tipoLente?: string;
  materialLente?: string;
  tratamento?: string;
  armacao?: string;
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
