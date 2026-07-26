/**
 * Cliente de la API de Declaras.
 *
 * Las peticiones van a /api, que el proxy de Vite reenvia al backend inyectando la llave
 * de API: el navegador nunca la tiene. En produccion ese papel lo cumple un gateway.
 */

const BASE = "/api";

/** Error con el codigo estable que devuelve el backend, para poder ramificar en la UI. */
export class ApiError extends Error {
  constructor({ code, message, retryable, details, status }) {
    super(message ?? "Error inesperado");
    this.name = "ApiError";
    this.code = code ?? "UNKNOWN";
    this.retryable = Boolean(retryable);
    this.details = details ?? {};
    this.status = status;
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${BASE}${path}`, options);
  } catch (cause) {
    throw new ApiError({
      code: "NETWORK_ERROR",
      message: "No se pudo contactar el servicio. ¿Está corriendo el backend?",
      retryable: true,
    });
  }

  if (response.status === 204) return null;

  const isJson = (response.headers.get("content-type") ?? "").includes("json");
  const body = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError({ ...(body ?? {}), status: response.status });
  }
  return body;
}

const json = (body) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const api = {
  health: () => request("/health"),

  listCases: () => request("/v1/cases"),
  getCase: (caseId) => request(`/v1/cases/${caseId}`),
  getCaseSummary: (caseId) => request(`/v1/cases/${caseId}/summary`),
  openCase: (payload) => request("/v1/cases", json(payload)),
  resolveFlag: (caseId, flagId, note) =>
    request(`/v1/cases/${caseId}/flags/${flagId}/resolve`, json({ note })),

  listClients: () => request("/v1/clients"),

  runExtraction: (payload) => request("/v1/extractions", json(payload)),
  getExtraction: (jobId) => request(`/v1/extractions/${jobId}`),
  linkExtraction: (caseId, jobId) =>
    request(`/v1/cases/${caseId}/link-extraction`, json({ job_id: jobId })),

  uploadDocument: (caseId, docType, file) => {
    const form = new FormData();
    form.append("doc_type", docType);
    form.append("file", file);
    return request(`/v1/cases/${caseId}/documents`, { method: "POST", body: form });
  },
};
