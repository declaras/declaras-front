/**
 * Cliente de la API de Declaras.
 *
 * Las peticiones van a /api, que el proxy de Vite reenvia al backend inyectando la llave
 * de API: el navegador nunca la tiene. En produccion ese papel lo cumple un gateway.
 */

import { cerrarSesionLocal, tokenVigente } from "./sesion";

const BASE = "/api";

/**
 * Le agrega a la peticion el token de la persona que esta entrada, si hay.
 *
 * ═══ COMO CONVIVE CON LA LLAVE DEL PROXY ═══
 *
 * El proxy le pone `X-API-Key` a todo lo que pasa, y reenvia `Authorization` sin tocarla. El
 * backend prefiere el token cuando llegan los dos. O sea que esto funciona sobre el despliegue tal
 * como esta, sin cambiar el proxy: mientras no haya sesion se entra como servicio —como hasta hoy—
 * y en cuanto alguien entra, la misma peticion pasa a estar firmada por una persona y la bitacora
 * empieza a decir la verdad.
 *
 * ═══ POR QUE SE PIDE EL TOKEN EN CADA PETICION ═══
 *
 * `tokenVigente` consulta al cliente de Supabase, que lo renueva solo si esta por vencer.
 * Guardarlo en una variable al entrar produciria el bug de la hora: todo funciona bien hasta que
 * el token vence y de golpe todo da 401, sin que nadie haya tocado nada.
 *
 * El costo es una llamada local —lee del almacenamiento, no de la red— asi que no hay nada que
 * optimizar aca.
 */
async function conSesion(options) {
  const token = await tokenVigente();
  if (!token) return options;
  return { ...options, headers: { ...(options.headers ?? {}), Authorization: `Bearer ${token}` } };
}

/** Error con el codigo estable que devuelve el backend, para poder ramificar en la UI. */
export class ApiError extends Error {
  // `cause` se encadena y no se descarta: el mensaje que ve la persona tiene que ser el de arriba
  // ("no se pudo contactar el servicio"), pero quien depura necesita el error original de `fetch`,
  // que es el que distingue un backend caido de un CORS o de una peticion abortada. Se estaba
  // capturando y tirando.
  constructor({ code, message, retryable, details, status, cause }) {
    super(message ?? "Error inesperado", { cause });
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
    response = await fetch(`${BASE}${path}`, await conSesion(options));
  } catch (cause) {
    throw new ApiError({
      code: "NETWORK_ERROR",
      message: "No se pudo contactar el servicio. ¿Está corriendo el backend?",
      retryable: true,
      cause,
    });
  }

  if (response.status === 204) return null;

  const isJson = (response.headers.get("content-type") ?? "").includes("json");
  const body = isJson ? await response.json() : null;

  if (!response.ok) {
    // Dos formas distintas de quedarse sin sesion a mitad de uso, y cada una se atiende donde vive.
    //
    // SIN_SESION es la clave compartida del middleware, que no es de este cliente: recargar hace
    // que el middleware responda con su pantalla. No hay bucle — esa respuesta ya no es la app.
    if (response.status === 401 && body?.code === "SIN_SESION") {
      globalThis.location?.reload();
    }
    // TOKEN_INVALIDO es la sesion de la persona: el token vencio o se revoco. Se cierra la sesion
    // local para que `Protegida` mande a `/login` en el proximo pintado. Sin esto la consola se
    // queda con un token muerto mostrando errores en cada panel y sin decir que hay que entrar de
    // nuevo — el sintoma seria "se dañó" y no "se venció la sesión".
    if (response.status === 401 && body?.code === "TOKEN_INVALIDO") {
      cerrarSesionLocal();
    }
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
  // El catálogo completo de beneficios con lo que cada uno ahorra. A diferencia de `peticiones`,
  // no desaparece cuando el cliente contesta que no lo tiene.
  getRecomendaciones: (caseId) => request(`/v1/cases/${caseId}/recomendaciones`),
  // El borrador que la DIAN precargó contra el nuestro, casilla por casilla.
  getComparacionDian: (caseId) => request(`/v1/cases/${caseId}/comparacion-con-la-dian`),
  // Contra la declaración que de verdad se presentó ese año, que en un año viejo es lo que hizo
  // un contador. Es la segunda opinión.
  getComparacionPresentada: (caseId) =>
    request(`/v1/cases/${caseId}/comparacion-con-lo-presentado`),
  cerrarLiquidacion: (caseId) =>
    request(`/v1/cases/${caseId}/liquidacion/cerrar`, { method: "POST" }),
};
