export type CategoriaProduto = "ARMACAO" | "LENTE" | "OCULOS_SOL" | "ACESSORIO";

export interface Produto {
  id: number;
  nome: string;
  categoria: CategoriaProduto;
  marca: string | null;
  descricao: string | null;
  preco: number;
  quantidadeEstoque: number;
  ativo: boolean;
  dataCadastro: string;
}

export interface ProdutoRequest {
  nome: string;
  categoria: CategoriaProduto;
  marca: string;
  descricao: string;
  preco: number;
  quantidadeEstoque: number;
  ativo: boolean;
}

export interface ProdutoListagemParams {
  nome?: string;
  categoria?: CategoriaProduto | "";
  ativo?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

export const categoriaLabels: Record<CategoriaProduto, string> = {
  ARMACAO: "Armação",
  LENTE: "Lente",
  OCULOS_SOL: "Óculos de sol",
  ACESSORIO: "Acessório",
};
