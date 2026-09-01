/**
 * Cliente de la API de Declaras.
 *
 * ═══ LE HABLA AL BACKEND DIRECTO, SIN INTERMEDIARIO ═══
 *
 * Antes las peticiones iban a `/api` del mismo dominio y un proxy las reenviaba inyectando una
 * `X-API-Key` compartida, para que la llave no bajara al navegador. Ese arreglo era circular —hacia
 * falta un servidor para esconder una credencial que existia por no saber quien era el usuario— y
 * dejo un agujero medido: el proxy le abria a cualquiera Y ponia la llave de su bolsillo, asi que un
 * `curl` sin autenticar devolvia cedulas y correos.
 *
 * Ahora el navegador manda el token de la persona que entro. Es una credencial que le PERTENECE, asi
 * que no hay nada que esconderle y no hace falta nadie en medio. El proxy se borro.
 *
 * Lo que eso trae: hace falta CORS del lado del backend (`DECLARAS_CORS_ORIGINS`), y desaparece el
 * tope de 4,5 MB que imponia la funcion de Vercel — o sea que un 220 escaneado grande ya sube.
 */

import { cerrarSesionLocal, tokenVigente } from "./sesion";

/**
 * Sin `VITE_API_URL` no hay a donde llamar, y se dice en vez de fallar raro.
 *
 * El default apunta al backend local. En un despliegue la variable es obligatoria: sin ella todas
 * las peticiones irian a `localhost` desde el navegador de otra persona, que falla con un error de
 * red indistinguible de "el servicio esta caido".
 */
const BASE = (import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

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

/**
 * La respuesta cruda de una peticion firmada, o un `ApiError` si el backend dijo que no.
 *
 * Existe aparte de `request` porque no todo lo que se le pide al backend es JSON: un PDF y una
 * memoria de calculo se piden igual, con la misma sesion y con los mismos errores, y lo unico
 * distinto es como se lee el cuerpo. Antes esto vivia dentro de `request`, asi que quien
 * necesitara bytes no tenia por donde entrar sin duplicar el manejo de sesion y de errores.
 */
async function pedir(path, options = {}) {
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

  if (response.ok) return response;

  const isJson = (response.headers.get("content-type") ?? "").includes("json");
  const body = isJson ? await response.json() : null;

  // El token vencio o se revoco a mitad de uso. Se cierra la sesion local para que `Protegida`
  // mande a `/login` en el proximo pintado. Sin esto la consola se queda con un token muerto
  // mostrando errores en cada panel sin decir que hay que entrar de nuevo — el sintoma seria
  // "se dañó" y no "se venció la sesión".
  //
  // Se ramifica por `code` y no solo por el 401: un 401 puede venir de otra cosa, y cerrar la
  // sesion por cualquier 401 sacaria a alguien a la calle por un error que no era de su sesion.
  if (response.status === 401 && body?.code === "TOKEN_INVALIDO") {
    cerrarSesionLocal();
  }
  throw new ApiError({ ...(body ?? {}), status: response.status });
}

async function request(path, options = {}) {
  const response = await pedir(path, options);
  if (response.status === 204) return null;
  const isJson = (response.headers.get("content-type") ?? "").includes("json");
  return isJson ? await response.json() : null;
}

/**
 * El contenido de un recurso protegido, ya con la sesion puesta.
 *
 * ═══ POR QUE NO SE PUEDE USAR LA URL DIRECTA ═══
 *
 * Un `<iframe src>`, un `<img src>` y un `<a href>` los resuelve el navegador por su cuenta, y el
 * navegador NO manda la cabecera `Authorization`. Como el backend exige token en todo, esas tres
 * cosas devolvian el JSON del 401 en vez del archivo: el visor pintaba
 * `{"code":"UNAUTHORIZED","message":"Necesitas haber ingresado para usar esto."}` dentro del marco,
 * la descarga bajaba ese texto con nombre de PDF, y la memoria de calculo abria una pestaña con el
 * mismo JSON. Se veia como un problema de almacenamiento y era de transporte: los bytes estaban
 * siempre ahi, lo que faltaba era la credencial en el camino.
 *
 * ═══ POR QUE NO SE HIZO CON UNA URL FIRMADA ═══
 *
 * Era la otra salida y quedaba peor: una URL firmada mete una credencial en la barra de
 * direcciones, o sea en el historial del navegador, en la cabecera `Referer` de lo que se cargue
 * despues y en los logs de acceso del servidor. Traer los bytes con la sesion y publicarlos como
 * `blob:` no expone nada, no necesita endpoint nuevo y no obliga a desplegar el backend.
 *
 * QUE VIGILAR EL DIA QUE EL ALMACENAMIENTO SEA GCS. Con disco local el backend responde los bytes,
 * que es el caso de hoy. Con GCS responde un 307 hacia una URL firmada, y `fetch` sigue el redirect
 * a otro dominio: ahi hara falta CORS en el bucket, o esto empieza a fallar sin que nada del codigo
 * haya cambiado.
 */
export async function archivo(ruta) {
  const response = await pedir(ruta);
  return response.blob();
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
  // Deshacer NO es contestar lo contrario: devuelve la pregunta a SIN CONTESTAR, que es un
  // estado distinto de "contestó que no" y el único que equivale a no haber respondido.
  deshacerRespuesta: (caseId, pregunta) =>
    request(`/v1/cases/${caseId}/respuestas/${encodeURIComponent(pregunta)}`, {
      method: "DELETE",
    }),

  getPatrimonio: (caseId) => request(`/v1/cases/${caseId}/patrimonio`),
  guardarBien: (caseId, bien) =>
    request(`/v1/cases/${caseId}/patrimonio/bienes`, json(bien)),
  borrarBien: (caseId, bienId) =>
    request(`/v1/cases/${caseId}/patrimonio/bienes/${encodeURIComponent(bienId)}`, {
      method: "DELETE",
    }),
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
  escribirAlPortal: (caseId, dianPassword) =>
    request(`/v1/cases/${caseId}/portal/escribir`, json({ dian_password: dianPassword })),
  // El historial de declaraciones anteriores. Solo se LEE: llegan con la consulta a la DIAN,
  // en la misma sesión, así que no hay clave que volver a pedir.
  getHistorial: (caseId) => request(`/v1/cases/${caseId}/historial`),
  cerrarLiquidacion: (caseId) =>
    request(`/v1/cases/${caseId}/liquidacion/cerrar`, { method: "POST" }),
};
