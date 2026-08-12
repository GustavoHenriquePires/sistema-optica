import { apiRequest, queryString } from "@/services/api";
import { DEMO_MODE } from "@/services/config";
import { demoClientesService } from "@/services/demo-clientes";
import type { PaginaResponse } from "@/types/api";
import type {
  Cliente,
  ClienteListagemParams,
  ClienteRequest,
} from "@/types/cliente";

export { DEMO_MODE } from "@/services/config";

export function listarClientes(
  params: ClienteListagemParams = {},
): Promise<PaginaResponse<Cliente>> {
  if (DEMO_MODE) return demoClientesService.listar(params);
  return apiRequest<PaginaResponse<Cliente>>(
    `/clientes${queryString({
      nome: params.nome,
      page: params.page ?? 0,
      size: params.size ?? 10,
      sort: params.sort ?? "nome,asc",
    })}`,
  );
}

export function buscarCliente(id: number): Promise<Cliente> {
  if (DEMO_MODE) return demoClientesService.buscar(id);
  return apiRequest<Cliente>(`/clientes/${id}`);
}

export function criarCliente(data: ClienteRequest): Promise<Cliente> {
  if (DEMO_MODE) return demoClientesService.criar(data);
  return apiRequest<Cliente>("/clientes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function atualizarCliente(
  id: number,
  data: ClienteRequest,
): Promise<Cliente> {
  if (DEMO_MODE) return demoClientesService.atualizar(id, data);
  return apiRequest<Cliente>(`/clientes/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function excluirCliente(id: number): Promise<void> {
  if (DEMO_MODE) return demoClientesService.excluir(id);
  return apiRequest<void>(`/clientes/${id}`, { method: "DELETE" });
}

export function resetarClientesDemo(): Promise<void> {
  return demoClientesService.resetar();
}
