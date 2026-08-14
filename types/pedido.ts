import type { Cliente } from "@/types/cliente";

export type StatusPedido =
  | "RECEBIDO" | "EM_PRODUCAO" | "AGUARDANDO_APROVACAO" | "AGUARDANDO_PAGAMENTO"
  | "DIGITADO" | "IMPRESSO" | "ESTOQUE" | "SEPARACAO" | "SURFACAGEM_F5"
  | "SURFACAGEM_FREEFORM" | "ANTI_RISCO_SPIN" | "COLORACAO" | "ANTI_RISCO"
  | "TRATAMENTO" | "CORTE" | "GRAVACAO" | "MONTAGEM" | "CONTROLE_QUALIDADE"
  | "DISTRIBUICAO" | "FINANCEIRO" | "PRONTO" | "ENTREGUE" | "RETRABALHO" | "CANCELADO";

export type PrioridadeOrdemServico = "NORMAL" | "URGENTE";
export type Olho = "OD" | "OE";

export interface ItemPedido { id: number; produtoId: number; produtoNome: string; quantidade: number; precoUnitario: number; subtotal: number; }
export interface LentePedido { id: number; olho: Olho; familiaLenteId: number; codigo: string; descricao: string; preco: number; blocoFornecido: boolean; observacao?: string | null; }
export interface ServicoPedido { id: number; servicoId: number; codigo: string; descricao: string; setor?: string | null; quantidade: number; precoUnitario: number; subtotal: number; }
export interface HistoricoStatusPedido { id: number; statusAnterior: StatusPedido | null; statusNovo: StatusPedido; usuario: string | null; observacao: string | null; dataHora: string; }

export interface Pedido {
  id: number; numeroOs?: string; cliente: Cliente; itens: ItemPedido[]; lentes?: LentePedido[]; servicos?: ServicoPedido[];
  valorTotal: number; status: StatusPedido; prioridade?: PrioridadeOrdemServico; dataPedido: string; dataPrevisao: string | null;
  odEsferico?: number | null; odCilindrico?: number | null; odEixo?: number | null; odAdicao?: number | null; odDnp?: number | null; odAltura?: number | null;
  oeEsferico?: number | null; oeCilindrico?: number | null; oeEixo?: number | null; oeAdicao?: number | null; oeDnp?: number | null; oeAltura?: number | null;
  tipoLente?: string | null; materialLente?: string | null; tratamento?: string | null; armacao?: string | null; observacoes: string | null;
}

export interface PedidoRequest {
  clienteId: number;
  itens: Array<{ produtoId: number; quantidade: number }>;
  lentes?: Array<{ olho: Olho; familiaLenteId: number; preco?: number | null; blocoFornecido?: boolean; observacao?: string }>;
  servicos?: Array<{ servicoId: number; quantidade?: number; precoUnitario?: number | null }>;
  dataPrevisao: string | null; prioridade?: PrioridadeOrdemServico;
  odEsferico?: number | null; odCilindrico?: number | null; odEixo?: number | null; odAdicao?: number | null; odDnp?: number | null; odAltura?: number | null;
  oeEsferico?: number | null; oeCilindrico?: number | null; oeEixo?: number | null; oeAdicao?: number | null; oeDnp?: number | null; oeAltura?: number | null;
  tipoLente?: string; materialLente?: string; tratamento?: string; armacao?: string; observacoes: string;
}

export interface PedidoListagemParams { status?: StatusPedido | ""; cliente?: string; page?: number; size?: number; sort?: string; }

export const statusLabels: Record<StatusPedido, string> = {
  RECEBIDO:"Recebido", EM_PRODUCAO:"Em produção", AGUARDANDO_APROVACAO:"Aguardando aprovação", AGUARDANDO_PAGAMENTO:"Aguardando pagamento",
  DIGITADO:"Digitado", IMPRESSO:"Impresso", ESTOQUE:"Estoque", SEPARACAO:"Separação", SURFACAGEM_F5:"Surfaçagem F5",
  SURFACAGEM_FREEFORM:"Surfaçagem FreeForm", ANTI_RISCO_SPIN:"Anti-risco SPIN", COLORACAO:"Coloração", ANTI_RISCO:"Anti-risco",
  TRATAMENTO:"Tratamento", CORTE:"Corte", GRAVACAO:"Gravação", MONTAGEM:"Montagem", CONTROLE_QUALIDADE:"Controle de qualidade",
  DISTRIBUICAO:"Distribuição", FINANCEIRO:"Financeiro", PRONTO:"Pronto", ENTREGUE:"Entregue", RETRABALHO:"Retrabalho", CANCELADO:"Cancelado"
};

export const nextStatus: Partial<Record<StatusPedido, StatusPedido>> = {
  RECEBIDO:"SEPARACAO", EM_PRODUCAO:"SEPARACAO", DIGITADO:"SEPARACAO", IMPRESSO:"SEPARACAO", ESTOQUE:"SEPARACAO",
  SEPARACAO:"SURFACAGEM_FREEFORM", SURFACAGEM_F5:"TRATAMENTO", SURFACAGEM_FREEFORM:"TRATAMENTO", ANTI_RISCO_SPIN:"TRATAMENTO",
  COLORACAO:"TRATAMENTO", ANTI_RISCO:"TRATAMENTO", TRATAMENTO:"CORTE", CORTE:"MONTAGEM", GRAVACAO:"MONTAGEM",
  MONTAGEM:"CONTROLE_QUALIDADE", CONTROLE_QUALIDADE:"DISTRIBUICAO", DISTRIBUICAO:"PRONTO", FINANCEIRO:"PRONTO", PRONTO:"ENTREGUE", RETRABALHO:"SEPARACAO"
};
