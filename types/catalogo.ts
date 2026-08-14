export interface FamiliaLente {
  id: number;
  codigo: string;
  descricao: string;
  material?: string | null;
  tecnologia?: string | null;
  tratamentoPadrao?: string | null;
  precoBase: number;
  ativo: boolean;
}

export interface ServicoLaboratorio {
  id: number;
  codigo: string;
  descricao: string;
  setor?: string | null;
  preco: number;
  ativo: boolean;
}
