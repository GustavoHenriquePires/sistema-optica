export interface Cliente {
  id: number;
  nome: string;
  cpf: string;
  telefone: string;
  email: string | null;
  dataCadastro: string;
}

export interface ClienteRequest {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
}

export interface ClienteListagemParams {
  nome?: string;
  page?: number;
  size?: number;
  sort?: string;
}
