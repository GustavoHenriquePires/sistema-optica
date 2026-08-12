import type { ApiErrorResponse } from "@/types/api";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"
).replace(/\/$/, "");

export class ApiClientError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;

  constructor(message: string, status: number, fieldErrors = {}) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiClientError(
      "Não foi possível conectar à API. Verifique se o backend está em execução.",
      0,
    );
  }

  if (!response.ok) {
    let error: Partial<ApiErrorResponse> = {};

    try {
      error = (await response.json()) as ApiErrorResponse;
    } catch {
      // A API pode estar atrás de um proxy que devolve erro sem corpo JSON.
    }

    throw new ApiClientError(
      error.message ?? "Não foi possível concluir a operação.",
      response.status,
      error.fieldErrors ?? {},
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function queryString(
  params: Record<string, string | number | undefined>,
): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const serialized = searchParams.toString();
  return serialized ? `?${serialized}` : "";
}
