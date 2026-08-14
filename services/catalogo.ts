import { apiRequest } from "@/services/api";
import type { FamiliaLente, ServicoLaboratorio } from "@/types/catalogo";

export function listarFamiliasLente() {
  return apiRequest<FamiliaLente[]>("/familias-lente");
}

export function listarServicosLaboratorio() {
  return apiRequest<ServicoLaboratorio[]>("/servicos-laboratorio");
}
