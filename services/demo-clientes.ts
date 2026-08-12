import { ApiClientError } from "@/services/api";
import type { PaginaResponse } from "@/types/api";
import type {
  Cliente,
  ClienteListagemParams,
  ClienteRequest,
} from "@/types/cliente";

const STORAGE_KEY = "sistema-optica:clientes-demo:v1";

const seedClientes: Cliente[] = [
  { id: 1, nome: "Ana Souza", cpf: "12345678909", telefone: "67999881122", email: "ana.souza@exemplo.com", dataCadastro: "2026-08-11T13:30:00" },
  { id: 2, nome: "Bruno Martins", cpf: "12359432087", telefone: "67991234567", email: "bruno.martins@exemplo.com", dataCadastro: "2026-08-10T10:15:00" },
  { id: 3, nome: "Carla Oliveira", cpf: "12373185130", telefone: "67988776655", email: "carla.oliveira@exemplo.com", dataCadastro: "2026-08-09T16:45:00" },
  { id: 4, nome: "Daniel Ferreira", cpf: "12386938220", telefone: "67995554433", email: "daniel.ferreira@exemplo.com", dataCadastro: "2026-08-08T09:20:00" },
  { id: 5, nome: "Eduarda Lima", cpf: "12400691380", telefone: "67984443322", email: "eduarda.lima@exemplo.com", dataCadastro: "2026-08-07T14:10:00" },
  { id: 6, nome: "Felipe Alves", cpf: "12414444479", telefone: "67993332211", email: "felipe.alves@exemplo.com", dataCadastro: "2026-08-06T11:35:00" },
  { id: 7, nome: "Gabriela Rocha", cpf: "12428197541", telefone: "67982221100", email: "gabriela.rocha@exemplo.com", dataCadastro: "2026-08-05T17:25:00" },
  { id: 8, nome: "Henrique Costa", cpf: "12441950657", telefone: "67991110099", email: "henrique.costa@exemplo.com", dataCadastro: "2026-08-04T08:50:00" },
  { id: 9, nome: "Isabela Mendes", cpf: "12455703746", telefone: "67980009988", email: "isabela.mendes@exemplo.com", dataCadastro: "2026-08-03T15:40:00" },
  { id: 10, nome: "João Carvalho", cpf: "12469456819", telefone: "67999998877", email: "joao.carvalho@exemplo.com", dataCadastro: "2026-08-02T12:05:00" },
  { id: 11, nome: "Larissa Gomes", cpf: "12483209998", telefone: "67988887766", email: "larissa.gomes@exemplo.com", dataCadastro: "2026-08-01T10:30:00" },
  { id: 12, nome: "Marcos Ribeiro", cpf: "12496963050", telefone: "67997776655", email: null, dataCadastro: "2026-07-31T09:15:00" },
];

export interface DemoStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function cloneSeeds(): Cliente[] {
  return seedClientes.map((cliente) => ({ ...cliente }));
}

function digits(value: string): string {
  return value.replace(/\D/g, "");
}

function normalizeRequest(request: ClienteRequest): ClienteRequest {
  return {
    nome: request.nome.trim(),
    cpf: digits(request.cpf),
    telefone: digits(request.telefone),
    email: request.email.trim(),
  };
}

export function createDemoClientesService(storage: DemoStorage, latencyMs = 220) {
  const delay = () =>
    latencyMs > 0
      ? new Promise<void>((resolve) => globalThis.setTimeout(resolve, latencyMs))
      : Promise.resolve();

  function read(): Cliente[] {
    const stored = storage.getItem(STORAGE_KEY);
    if (!stored) {
      const initial = cloneSeeds();
      storage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }

    try {
      const parsed = JSON.parse(stored) as Cliente[];
      return Array.isArray(parsed) ? parsed : cloneSeeds();
    } catch {
      const initial = cloneSeeds();
      storage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
  }

  function write(clientes: Cliente[]) {
    storage.setItem(STORAGE_KEY, JSON.stringify(clientes));
  }

  async function listar(
    params: ClienteListagemParams = {},
  ): Promise<PaginaResponse<Cliente>> {
    await delay();
    const page = Math.max(0, params.page ?? 0);
    const size = Math.max(1, params.size ?? 10);
    const nome = params.nome?.trim().toLocaleLowerCase("pt-BR") ?? "";
    const filtered = read()
      .filter((cliente) => cliente.nome.toLocaleLowerCase("pt-BR").includes(nome))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    const totalElements = filtered.length;
    const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / size);
    const content = filtered.slice(page * size, page * size + size);

    return {
      content: content.map((cliente) => ({ ...cliente })),
      page,
      size,
      totalElements,
      totalPages,
      first: page === 0,
      last: totalPages === 0 || page >= totalPages - 1,
    };
  }

  async function buscar(id: number): Promise<Cliente> {
    await delay();
    const cliente = read().find((item) => item.id === id);
    if (!cliente) throw new ApiClientError("Cliente não encontrado.", 404);
    return { ...cliente };
  }

  async function criar(request: ClienteRequest): Promise<Cliente> {
    await delay();
    const data = normalizeRequest(request);
    const clientes = read();
    if (clientes.some((cliente) => cliente.cpf === data.cpf)) {
      throw new ApiClientError("Já existe um cliente cadastrado com este CPF.", 409, {
        cpf: "CPF já cadastrado.",
      });
    }

    const cliente: Cliente = {
      id: clientes.reduce((largest, item) => Math.max(largest, item.id), 0) + 1,
      nome: data.nome,
      cpf: data.cpf,
      telefone: data.telefone,
      email: data.email || null,
      dataCadastro: new Date().toISOString(),
    };
    write([...clientes, cliente]);
    return { ...cliente };
  }

  async function atualizar(id: number, request: ClienteRequest): Promise<Cliente> {
    await delay();
    const data = normalizeRequest(request);
    const clientes = read();
    const index = clientes.findIndex((cliente) => cliente.id === id);
    if (index < 0) throw new ApiClientError("Cliente não encontrado.", 404);
    if (clientes.some((cliente) => cliente.id !== id && cliente.cpf === data.cpf)) {
      throw new ApiClientError("Já existe um cliente cadastrado com este CPF.", 409, {
        cpf: "CPF já cadastrado.",
      });
    }

    const updated: Cliente = {
      ...clientes[index],
      nome: data.nome,
      cpf: data.cpf,
      telefone: data.telefone,
      email: data.email || null,
    };
    clientes[index] = updated;
    write(clientes);
    return { ...updated };
  }

  async function excluir(id: number): Promise<void> {
    await delay();
    const clientes = read();
    if (!clientes.some((cliente) => cliente.id === id)) {
      throw new ApiClientError("Cliente não encontrado.", 404);
    }
    write(clientes.filter((cliente) => cliente.id !== id));
  }

  async function resetar(): Promise<void> {
    await delay();
    storage.removeItem(STORAGE_KEY);
    write(cloneSeeds());
  }

  return { listar, buscar, criar, atualizar, excluir, resetar };
}

function browserDemoService() {
  if (typeof window === "undefined") {
    throw new ApiClientError("O modo demonstração precisa ser executado no navegador.", 0);
  }
  return createDemoClientesService(window.localStorage);
}

export const demoClientesService = {
  listar: (params?: ClienteListagemParams) => browserDemoService().listar(params),
  buscar: (id: number) => browserDemoService().buscar(id),
  criar: (data: ClienteRequest) => browserDemoService().criar(data),
  atualizar: (id: number, data: ClienteRequest) => browserDemoService().atualizar(id, data),
  excluir: (id: number) => browserDemoService().excluir(id),
  resetar: () => browserDemoService().resetar(),
};
