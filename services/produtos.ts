import { apiRequest, queryString } from "@/services/api";
import { DEMO_MODE } from "@/services/config";
import { demoProdutosService } from "@/services/demo-produtos";
import type { PaginaResponse } from "@/types/api";
import type { Produto, ProdutoListagemParams, ProdutoRequest } from "@/types/produto";

export function listarProdutos(params: ProdutoListagemParams = {}): Promise<PaginaResponse<Produto>> {
  if (DEMO_MODE) return demoProdutosService.listar(params);
  return apiRequest<PaginaResponse<Produto>>(`/produtos${queryString({
    nome: params.nome,
    categoria: params.categoria,
    ativo: params.ativo === undefined ? undefined : String(params.ativo),
    page: params.page ?? 0,
    size: params.size ?? 10,
    sort: params.sort ?? "nome,asc",
  })}`);
}

export function buscarProduto(id: number) {
  if (DEMO_MODE) return demoProdutosService.buscar(id);
  return apiRequest<Produto>(`/produtos/${id}`);
}

export function criarProduto(request: ProdutoRequest) {
  if (DEMO_MODE) return demoProdutosService.criar(request);
  return apiRequest<Produto>("/produtos", { method: "POST", body: JSON.stringify(request) });
}

export function atualizarProduto(id: number, request: ProdutoRequest) {
  if (DEMO_MODE) return demoProdutosService.atualizar(id, request);
  return apiRequest<Produto>(`/produtos/${id}`, { method: "PUT", body: JSON.stringify(request) });
}

export function atualizarEstoque(id: number, quantidadeEstoque: number) {
  if (DEMO_MODE) return demoProdutosService.atualizarEstoque(id, quantidadeEstoque);
  return apiRequest<Produto>(`/produtos/${id}/estoque`, {
    method: "PATCH",
    body: JSON.stringify({ quantidadeEstoque }),
  });
}

export function excluirProduto(id: number) {
  if (DEMO_MODE) return demoProdutosService.excluir(id);
  return apiRequest<void>(`/produtos/${id}`, { method: "DELETE" });
}

export function resetarProdutosDemo() {
  return demoProdutosService.resetar();
}
