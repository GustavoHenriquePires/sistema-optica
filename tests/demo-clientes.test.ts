import { beforeEach, describe, expect, it } from "vitest";
import {
  createDemoClientesService,
  type DemoStorage,
} from "@/services/demo-clientes";

class MemoryStorage implements DemoStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  clear() {
    this.values.clear();
  }
}

describe("serviço de clientes em modo demonstração", () => {
  const storage = new MemoryStorage();
  const service = createDemoClientesService(storage, 0);

  beforeEach(() => storage.clear());

  it("lista os dados iniciais com paginação", async () => {
    const firstPage = await service.listar({ page: 0, size: 10 });
    const secondPage = await service.listar({ page: 1, size: 10 });

    expect(firstPage.totalElements).toBe(12);
    expect(firstPage.totalPages).toBe(2);
    expect(firstPage.content).toHaveLength(10);
    expect(firstPage.first).toBe(true);
    expect(secondPage.content).toHaveLength(2);
    expect(secondPage.last).toBe(true);
  });

  it("pesquisa clientes pelo nome ignorando maiúsculas", async () => {
    const result = await service.listar({ nome: "ANA", page: 0, size: 10 });

    expect(result.totalElements).toBe(1);
    expect(result.content[0].nome).toBe("Ana Souza");
  });

  it("cria e consulta um novo cliente", async () => {
    const created = await service.criar({
      nome: "  Paula Nunes  ",
      cpf: "987.654.321-00",
      telefone: "(67) 99999-0000",
      email: "paula@exemplo.com",
    });

    expect(created.id).toBe(13);
    expect(created.nome).toBe("Paula Nunes");
    expect(created.cpf).toBe("98765432100");
    await expect(service.buscar(created.id)).resolves.toMatchObject({
      nome: "Paula Nunes",
    });
  });

  it("edita e exclui um cliente", async () => {
    const updated = await service.atualizar(1, {
      nome: "Ana Souza Lima",
      cpf: "123.456.789-09",
      telefone: "(67) 98888-7777",
      email: "ana.lima@exemplo.com",
    });

    expect(updated.nome).toBe("Ana Souza Lima");
    expect(updated.telefone).toBe("67988887777");

    await service.excluir(1);
    await expect(service.buscar(1)).rejects.toMatchObject({ status: 404 });
  });

  it("impede CPF duplicado e restaura a base inicial", async () => {
    await expect(
      service.criar({
        nome: "Outra Ana",
        cpf: "123.456.789-09",
        telefone: "(67) 99999-0000",
        email: "outra@exemplo.com",
      }),
    ).rejects.toMatchObject({
      status: 409,
      fieldErrors: { cpf: "CPF já cadastrado." },
    });

    await service.excluir(1);
    await service.resetar();
    const restored = await service.listar({ page: 0, size: 20 });
    expect(restored.totalElements).toBe(12);
  });
});
