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

  /**
   * Sube varios archivos en una sola peticion y devuelve el desenlace de CADA UNO.
   *
   * Los `doc_type` van en el mismo orden que los archivos: el backend empareja por indice,
   * no por nombre — dos archivos con el mismo nombre recibian el desenlace del otro.
   */
  uploadDocuments: (caseId, entradas) => {
    const form = new FormData();
    for (const { docType, file } of entradas) {
      form.append("doc_type", docType);
      form.append("file", file);
    }
    return request(`/v1/cases/${caseId}/documents`, { method: "POST", body: form });
  },

  // ─────────────────────────── conciliacion ───────────────────────────

  runConciliacion: (caseId) => request(`/v1/cases/${caseId}/conciliacion`, { method: "POST" }),
  getConciliacion: (caseId) => request(`/v1/cases/${caseId}/conciliacion`),

  /**
   * Resuelve un renglon. OJO con el id: NO es un UUID — lleva dos puntos (`nit:CONCEPTO`) y
   * puede llevar espacios o barras, asi que va codificado o la ruta se parte.
   */
  resolverPartida: (caseId, partidaId, payload) =>
    request(
      `/v1/cases/${caseId}/conciliacion/${encodeURIComponent(partidaId)}/resolver`,
      json(payload),
    ),

  listPeticiones: (caseId) => request(`/v1/cases/${caseId}/peticiones`),
  listRespuestas: (caseId) => request(`/v1/cases/${caseId}/respuestas`),
  postRespuesta: (caseId, payload) => request(`/v1/cases/${caseId}/respuestas`, json(payload)),
  cerrarPeticion: (caseId, peticionId) =>
    request(`/v1/cases/${caseId}/cerrar-peticion/${encodeURIComponent(peticionId)}`, {
      method: "POST",
    }),

  getLiquidacion: (caseId) => request(`/v1/cases/${caseId}/liquidacion`),
  getFormulario: (caseId) => request(`/v1/cases/${caseId}/formulario`),
  cerrarLiquidacion: (caseId) =>
    request(`/v1/cases/${caseId}/liquidacion/cerrar`, { method: "POST" }),
};
