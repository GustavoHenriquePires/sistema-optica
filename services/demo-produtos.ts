import { ApiClientError } from "@/services/api";
import type { DemoStorage } from "@/services/demo-clientes";
import type { PaginaResponse } from "@/types/api";
import type {
  Produto,
  ProdutoListagemParams,
  ProdutoRequest,
} from "@/types/produto";

const STORAGE_KEY = "sistema-optica:produtos-demo:v1";

const seedProdutos: Produto[] = [
  { id: 1, nome: "Armação Urban 402", categoria: "ARMACAO", marca: "Urban", descricao: "Armação retangular em acetato preto", preco: 349.9, quantidadeEstoque: 8, ativo: true, dataCadastro: "2026-08-11T14:20:00" },
  { id: 2, nome: "Armação Elegance 210", categoria: "ARMACAO", marca: "Elegance", descricao: "Armação feminina dourada", preco: 429.9, quantidadeEstoque: 3, ativo: true, dataCadastro: "2026-08-10T09:15:00" },
  { id: 3, nome: "Lente Blue Cut 1.56", categoria: "LENTE", marca: "Vision Pro", descricao: "Proteção contra luz azul e antirreflexo", preco: 189.9, quantidadeEstoque: 24, ativo: true, dataCadastro: "2026-08-09T16:30:00" },
  { id: 4, nome: "Lente Progressiva Premium", categoria: "LENTE", marca: "Hoya", descricao: "Lente multifocal de alta definição", preco: 899, quantidadeEstoque: 6, ativo: true, dataCadastro: "2026-08-08T11:45:00" },
  { id: 5, nome: "Solar Aviador Classic", categoria: "OCULOS_SOL", marca: "Sunset", descricao: "Óculos solar aviador com proteção UV400", preco: 299.9, quantidadeEstoque: 12, ativo: true, dataCadastro: "2026-08-07T10:10:00" },
  { id: 6, nome: "Solar Wayfarer Black", categoria: "OCULOS_SOL", marca: "Ray-Ban", descricao: "Modelo clássico preto polarizado", preco: 749.9, quantidadeEstoque: 2, ativo: true, dataCadastro: "2026-08-06T15:25:00" },
  { id: 7, nome: "Estojo Rígido Premium", categoria: "ACESSORIO", marca: "OptiCase", descricao: "Estojo rígido com acabamento interno", preco: 39.9, quantidadeEstoque: 35, ativo: true, dataCadastro: "2026-08-05T13:40:00" },
  { id: 8, nome: "Spray Limpa Lentes", categoria: "ACESSORIO", marca: "ClearView", descricao: "Frasco de 60 ml", preco: 18.5, quantidadeEstoque: 4, ativo: true, dataCadastro: "2026-08-04T08:55:00" },
  { id: 9, nome: "Cordão Esportivo", categoria: "ACESSORIO", marca: "Active", descricao: "Cordão ajustável para armações", preco: 24.9, quantidadeEstoque: 0, ativo: true, dataCadastro: "2026-08-03T17:05:00" },
  { id: 10, nome: "Armação Kids Flex", categoria: "ARMACAO", marca: "KidsFun", descricao: "Armação infantil flexível azul", preco: 259.9, quantidadeEstoque: 5, ativo: true, dataCadastro: "2026-08-02T12:00:00" },
  { id: 11, nome: "Lente Fotossensível 1.67", categoria: "LENTE", marca: "Transitions", descricao: "Lente de alto índice fotossensível", preco: 649.9, quantidadeEstoque: 9, ativo: true, dataCadastro: "2026-08-01T14:35:00" },
  { id: 12, nome: "Armação Vintage 88", categoria: "ARMACAO", marca: "Retro", descricao: "Modelo descontinuado", preco: 199.9, quantidadeEstoque: 0, ativo: false, dataCadastro: "2026-07-30T09:25:00" },
];

function cloneSeeds() {
  return seedProdutos.map((produto) => ({ ...produto }));
}

export function createDemoProdutosService(storage: DemoStorage, latencyMs = 220) {
  const delay = () =>
    latencyMs > 0
      ? new Promise<void>((resolve) => globalThis.setTimeout(resolve, latencyMs))
      : Promise.resolve();

  function read(): Produto[] {
    const stored = storage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Produto[];
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // Restaura a base fictícia se os dados locais estiverem corrompidos.
      }
    }
    const initial = cloneSeeds();
    storage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  function write(produtos: Produto[]) {
    storage.setItem(STORAGE_KEY, JSON.stringify(produtos));
  }

  async function listar(params: ProdutoListagemParams = {}): Promise<PaginaResponse<Produto>> {
    await delay();
    const page = Math.max(0, params.page ?? 0);
    const size = Math.max(1, params.size ?? 10);
    const nome = params.nome?.trim().toLocaleLowerCase("pt-BR") ?? "";
    const filtered = read()
      .filter((produto) => produto.nome.toLocaleLowerCase("pt-BR").includes(nome))
      .filter((produto) => !params.categoria || produto.categoria === params.categoria)
      .filter((produto) => params.ativo === undefined || produto.ativo === params.ativo)
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    const totalElements = filtered.length;
    const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / size);

    return {
      content: filtered.slice(page * size, page * size + size).map((produto) => ({ ...produto })),
      page,
      size,
      totalElements,
      totalPages,
      first: page === 0,
      last: totalPages === 0 || page >= totalPages - 1,
    };
  }

  async function buscar(id: number) {
    await delay();
    const produto = read().find((item) => item.id === id);
    if (!produto) throw new ApiClientError("Produto não encontrado.", 404);
    return { ...produto };
  }

  async function criar(request: ProdutoRequest) {
    await delay();
    const produtos = read();
    const produto: Produto = {
      id: produtos.reduce((largest, item) => Math.max(largest, item.id), 0) + 1,
      nome: request.nome.trim(),
      categoria: request.categoria,
      marca: request.marca.trim() || null,
      descricao: request.descricao.trim() || null,
      preco: Number(request.preco),
      quantidadeEstoque: Number(request.quantidadeEstoque),
      ativo: request.ativo,
      dataCadastro: new Date().toISOString(),
    };
    write([...produtos, produto]);
    return { ...produto };
  }

  async function atualizar(id: number, request: ProdutoRequest) {
    await delay();
    const produtos = read();
    const index = produtos.findIndex((produto) => produto.id === id);
    if (index < 0) throw new ApiClientError("Produto não encontrado.", 404);
    const updated: Produto = {
      ...produtos[index],
      nome: request.nome.trim(),
      categoria: request.categoria,
      marca: request.marca.trim() || null,
      descricao: request.descricao.trim() || null,
      preco: Number(request.preco),
      quantidadeEstoque: Number(request.quantidadeEstoque),
      ativo: request.ativo,
    };
    produtos[index] = updated;
    write(produtos);
    return { ...updated };
  }

  async function atualizarEstoque(id: number, quantidadeEstoque: number) {
    await delay();
    const produtos = read();
    const index = produtos.findIndex((produto) => produto.id === id);
    if (index < 0) throw new ApiClientError("Produto não encontrado.", 404);
    produtos[index] = { ...produtos[index], quantidadeEstoque };
    write(produtos);
    return { ...produtos[index] };
  }

  async function excluir(id: number) {
    await delay();
    const produtos = read();
    if (!produtos.some((produto) => produto.id === id)) {
      throw new ApiClientError("Produto não encontrado.", 404);
    }
    write(produtos.filter((produto) => produto.id !== id));
  }

  async function resetar() {
    await delay();
    storage.removeItem(STORAGE_KEY);
    write(cloneSeeds());
  }

  return { listar, buscar, criar, atualizar, atualizarEstoque, excluir, resetar };
}

function browserService() {
  if (typeof window === "undefined") {
    throw new ApiClientError("O modo demonstração precisa ser executado no navegador.", 0);
  }
  return createDemoProdutosService(window.localStorage);
}

export const demoProdutosService = {
  listar: (params?: ProdutoListagemParams) => browserService().listar(params),
  buscar: (id: number) => browserService().buscar(id),
  criar: (request: ProdutoRequest) => browserService().criar(request),
  atualizar: (id: number, request: ProdutoRequest) => browserService().atualizar(id, request),
  atualizarEstoque: (id: number, quantidade: number) => browserService().atualizarEstoque(id, quantidade),
  excluir: (id: number) => browserService().excluir(id),
  resetar: () => browserService().resetar(),
};
