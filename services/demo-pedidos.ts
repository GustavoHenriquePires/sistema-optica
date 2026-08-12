import { ApiClientError } from "@/services/api";
import { demoClientesService, type DemoStorage } from "@/services/demo-clientes";
import { demoProdutosService } from "@/services/demo-produtos";
import type { PaginaResponse } from "@/types/api";
import type { Pedido, PedidoListagemParams, PedidoRequest, StatusPedido } from "@/types/pedido";

const STORAGE_KEY = "sistema-optica:pedidos-demo:v1";

function dateOffset(days: number, hour = 10) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function dateOnly(days: number) {
  return dateOffset(days).slice(0, 10);
}

async function seedOrders(): Promise<Pedido[]> {
  const clients = (await demoClientesService.listar({ page: 0, size: 20 })).content;
  const products = (await demoProdutosService.listar({ page: 0, size: 100 })).content;
  const make = (id: number, clientIndex: number, status: StatusPedido, productEntries: Array<[number, number]>, orderedDays: number, dueDays: number): Pedido => {
    const itens = productEntries.map(([productId, quantidade], index) => {
      const produto = products.find((item) => item.id === productId)!;
      return { id: id * 10 + index, produtoId: produto.id, produtoNome: produto.nome, quantidade, precoUnitario: produto.preco, subtotal: produto.preco * quantidade };
    });
    return { id, cliente: clients[clientIndex], itens, valorTotal: itens.reduce((sum, item) => sum + item.subtotal, 0), status, dataPedido: dateOffset(orderedDays, 9 + id), dataPrevisao: dateOnly(dueDays), observacoes: id === 1 ? "Conferir altura de montagem antes da produção." : null };
  };
  return [
    make(1, 0, "EM_PRODUCAO", [[1, 1], [3, 2]], -2, 3),
    make(2, 1, "RECEBIDO", [[2, 1], [4, 2]], -1, 5),
    make(3, 2, "PRONTO", [[5, 1]], -4, 0),
    make(4, 3, "ENTREGUE", [[10, 1], [7, 1]], -7, -2),
    make(5, 4, "CANCELADO", [[6, 1]], -5, 2),
  ];
}

export function createDemoPedidosService(storage: DemoStorage, latencyMs = 220) {
  const delay = () => latencyMs > 0 ? new Promise<void>((resolve) => globalThis.setTimeout(resolve, latencyMs)) : Promise.resolve();

  async function read(): Promise<Pedido[]> {
    const stored = storage.getItem(STORAGE_KEY);
    if (stored) {
      try { const parsed = JSON.parse(stored) as Pedido[]; if (Array.isArray(parsed)) return parsed; } catch { /* restaura abaixo */ }
    }
    const initial = await seedOrders();
    storage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  function write(pedidos: Pedido[]) { storage.setItem(STORAGE_KEY, JSON.stringify(pedidos)); }

  async function listar(params: PedidoListagemParams = {}): Promise<PaginaResponse<Pedido>> {
    await delay();
    const page = Math.max(0, params.page ?? 0); const size = Math.max(1, params.size ?? 10);
    const cliente = params.cliente?.trim().toLocaleLowerCase("pt-BR") ?? "";
    const filtered = (await read()).filter((pedido) => !params.status || pedido.status === params.status).filter((pedido) => pedido.cliente.nome.toLocaleLowerCase("pt-BR").includes(cliente)).sort((a, b) => b.dataPedido.localeCompare(a.dataPedido));
    const totalElements = filtered.length; const totalPages = totalElements ? Math.ceil(totalElements / size) : 0;
    return { content: filtered.slice(page * size, page * size + size), page, size, totalElements, totalPages, first: page === 0, last: totalPages === 0 || page >= totalPages - 1 };
  }

  async function buscar(id: number) {
    await delay(); const pedido = (await read()).find((item) => item.id === id);
    if (!pedido) throw new ApiClientError("Pedido não encontrado.", 404);
    return structuredClone(pedido);
  }

  async function criar(request: PedidoRequest) {
    await delay();
    if (!request.clienteId) throw new ApiClientError("Selecione um cliente.", 400, { clienteId: "O cliente é obrigatório." });
    if (!request.itens.length) throw new ApiClientError("Adicione pelo menos um item.", 400, { itens: "O pedido deve possuir pelo menos um item." });
    const cliente = await demoClientesService.buscar(request.clienteId);
    const grouped = new Map<number, number>();
    request.itens.forEach((item) => grouped.set(item.produtoId, (grouped.get(item.produtoId) ?? 0) + item.quantidade));
    const itens = [];
    for (const [produtoId, quantidade] of grouped) {
      if (quantidade <= 0) throw new ApiClientError("A quantidade deve ser maior que zero.", 400);
      const produto = await demoProdutosService.buscar(produtoId);
      if (!produto.ativo) throw new ApiClientError(`O produto ${produto.nome} está inativo.`, 422);
      if (produto.quantidadeEstoque < quantidade) throw new ApiClientError(`Estoque insuficiente para o produto ${produto.nome}.`, 422);
      itens.push({ id: Date.now() + itens.length, produtoId, produtoNome: produto.nome, quantidade, precoUnitario: produto.preco, subtotal: produto.preco * quantidade });
    }
    for (const item of itens) {
      const produto = await demoProdutosService.buscar(item.produtoId);
      await demoProdutosService.atualizarEstoque(item.produtoId, produto.quantidadeEstoque - item.quantidade);
    }
    const pedidos = await read();
    const pedido: Pedido = { id: pedidos.reduce((max, item) => Math.max(max, item.id), 0) + 1, cliente, itens, valorTotal: itens.reduce((sum, item) => sum + item.subtotal, 0), status: "RECEBIDO", dataPedido: new Date().toISOString(), dataPrevisao: request.dataPrevisao || null, observacoes: request.observacoes.trim() || null };
    write([...pedidos, pedido]); return structuredClone(pedido);
  }

  async function atualizarStatus(id: number, status: StatusPedido) {
    await delay(); const pedidos = await read(); const index = pedidos.findIndex((pedido) => pedido.id === id);
    if (index < 0) throw new ApiClientError("Pedido não encontrado.", 404);
    const atual = pedidos[index].status;
    const allowed: Partial<Record<StatusPedido, StatusPedido>> = { RECEBIDO: "EM_PRODUCAO", EM_PRODUCAO: "PRONTO", PRONTO: "ENTREGUE" };
    if (atual === "ENTREGUE" || atual === "CANCELADO") throw new ApiClientError("Pedidos finalizados não podem mudar de status.", 422);
    if (status !== "CANCELADO" && allowed[atual] !== status) throw new ApiClientError("Transição de status inválida.", 422);
    if (status === "CANCELADO") for (const item of pedidos[index].itens) { const produto = await demoProdutosService.buscar(item.produtoId); await demoProdutosService.atualizarEstoque(item.produtoId, produto.quantidadeEstoque + item.quantidade); }
    pedidos[index] = { ...pedidos[index], status }; write(pedidos); return structuredClone(pedidos[index]);
  }

  async function excluir(id: number) {
    await delay(); const pedidos = await read(); const pedido = pedidos.find((item) => item.id === id);
    if (!pedido) throw new ApiClientError("Pedido não encontrado.", 404);
    if (pedido.status !== "CANCELADO") throw new ApiClientError("Apenas pedidos cancelados podem ser excluídos.", 422);
    write(pedidos.filter((item) => item.id !== id));
  }

  async function resetar() {
    await delay();
    await Promise.all([demoClientesService.resetar(), demoProdutosService.resetar()]);
    storage.removeItem(STORAGE_KEY);
    write(await seedOrders());
  }
  return { listar, buscar, criar, atualizarStatus, excluir, resetar };
}

function browserService() { if (typeof window === "undefined") throw new ApiClientError("O modo demonstração precisa ser executado no navegador.", 0); return createDemoPedidosService(window.localStorage); }
export const demoPedidosService = { listar: (params?: PedidoListagemParams) => browserService().listar(params), buscar: (id: number) => browserService().buscar(id), criar: (request: PedidoRequest) => browserService().criar(request), atualizarStatus: (id: number, status: StatusPedido) => browserService().atualizarStatus(id, status), excluir: (id: number) => browserService().excluir(id), resetar: () => browserService().resetar() };
