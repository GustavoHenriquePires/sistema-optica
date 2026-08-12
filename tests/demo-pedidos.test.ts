import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDemoPedidosService } from "@/services/demo-pedidos";
import { createDemoProdutosService } from "@/services/demo-produtos";
import type { DemoStorage } from "@/services/demo-clientes";

class MemoryStorage implements DemoStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

describe("pedidos em modo demonstração", () => {
  const storage = new MemoryStorage();
  const service = createDemoPedidosService(storage, 0);
  const products = createDemoProdutosService(storage, 0);

  beforeEach(() => {
    storage.clear();
    vi.stubGlobal("window", { localStorage: storage });
  });

  it("lista os pedidos iniciais e filtra por status", async () => {
    const all = await service.listar({ page: 0, size: 10 });
    const ready = await service.listar({ status: "PRONTO", page: 0, size: 10 });
    expect(all.totalElements).toBe(5);
    expect(ready.content).toHaveLength(1);
    expect(ready.content[0].status).toBe("PRONTO");
  });

  it("cria pedido, calcula o total e baixa o estoque", async () => {
    const before = await products.buscar(1);
    const created = await service.criar({ clienteId: 1, itens: [{ produtoId: 1, quantidade: 2 }], dataPrevisao: null, observacoes: "Teste" });
    expect(created.valorTotal).toBe(before.preco * 2);
    expect(created.status).toBe("RECEBIDO");
    expect((await products.buscar(1)).quantidadeEstoque).toBe(before.quantidadeEstoque - 2);
  });

  it("percorre o fluxo de produção", async () => {
    const created = await service.criar({ clienteId: 1, itens: [{ produtoId: 1, quantidade: 1 }], dataPrevisao: null, observacoes: "" });
    expect((await service.atualizarStatus(created.id, "EM_PRODUCAO")).status).toBe("EM_PRODUCAO");
    expect((await service.atualizarStatus(created.id, "PRONTO")).status).toBe("PRONTO");
    expect((await service.atualizarStatus(created.id, "ENTREGUE")).status).toBe("ENTREGUE");
    await expect(service.atualizarStatus(created.id, "CANCELADO")).rejects.toMatchObject({ status: 422 });
  });

  it("cancela, devolve o estoque e permite excluir", async () => {
    const before = await products.buscar(2);
    const created = await service.criar({ clienteId: 1, itens: [{ produtoId: 2, quantidade: 1 }], dataPrevisao: null, observacoes: "" });
    await service.atualizarStatus(created.id, "CANCELADO");
    expect((await products.buscar(2)).quantidadeEstoque).toBe(before.quantidadeEstoque);
    await service.excluir(created.id);
    await expect(service.buscar(created.id)).rejects.toMatchObject({ status: 404 });
  });

  it("rejeita estoque insuficiente", async () => {
    await expect(service.criar({ clienteId: 1, itens: [{ produtoId: 1, quantidade: 999 }], dataPrevisao: null, observacoes: "" })).rejects.toMatchObject({ status: 422 });
  });
});
