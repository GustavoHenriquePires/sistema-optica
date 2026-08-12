import { beforeEach, describe, expect, it } from "vitest";
import { createDemoProdutosService } from "@/services/demo-produtos";
import type { DemoStorage } from "@/services/demo-clientes";

class MemoryStorage implements DemoStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

describe("produtos em modo demonstração", () => {
  const storage = new MemoryStorage();
  const service = createDemoProdutosService(storage, 0);

  beforeEach(() => storage.clear());

  it("lista, pesquisa e filtra produtos", async () => {
    const all = await service.listar({ page: 0, size: 10 });
    const lenses = await service.listar({ categoria: "LENTE", page: 0, size: 20 });
    const search = await service.listar({ nome: "blue cut", page: 0, size: 10 });
    expect(all.totalElements).toBe(12);
    expect(all.totalPages).toBe(2);
    expect(lenses.content.every((item) => item.categoria === "LENTE")).toBe(true);
    expect(search.content[0].nome).toBe("Lente Blue Cut 1.56");
  });

  it("executa cadastro, edição, ajuste de estoque e exclusão", async () => {
    const created = await service.criar({
      nome: "Armação Teste",
      categoria: "ARMACAO",
      marca: "Demo",
      descricao: "Produto criado pelo teste",
      preco: 150,
      quantidadeEstoque: 2,
      ativo: true,
    });
    expect(created.id).toBe(13);

    const updated = await service.atualizar(created.id, { ...created, nome: "Armação Editada", marca: "Demo" , descricao: "Editado" });
    expect(updated.nome).toBe("Armação Editada");
    expect((await service.atualizarEstoque(created.id, 20)).quantidadeEstoque).toBe(20);

    await service.excluir(created.id);
    await expect(service.buscar(created.id)).rejects.toMatchObject({ status: 404 });
  });

  it("restaura os dados iniciais", async () => {
    await service.excluir(1);
    await service.resetar();
    expect((await service.listar({ page: 0, size: 20 })).totalElements).toBe(12);
  });
});
