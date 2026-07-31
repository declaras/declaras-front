/**
 * Reenvia /api/* al backend agregando la llave. Es lo que en desarrollo hace el proxy de Vite.
 *
 * POR QUE EXISTE. Sin esto, la unica forma de que la consola hable con el backend es meter la
 * llave en el bundle, donde la lee cualquiera que abra las herramientas del navegador. Esa llave
 * da acceso a declaraciones de renta de personas reales.
 *
 * SIN DEPENDENCIAS, a proposito: es un intermediario que toca datos tributarios y cada paquete
 * agregado es superficie que auditar.
 *
 * ═══ EL LIMITE QUE HAY QUE CONOCER ═══
 *
 * Una funcion de Vercel acepta como maximo 4,5 MB de cuerpo y devuelve 413 al pasarlo. Un 220
 * exportado por una nomina pesa ~100 KB y entra sin problema; uno ESCANEADO puede pesar 5-10 MB
 * y va a fallar — y son justo los que mas necesitan al extractor.
 *
 * No se tapa con un reintento: es un limite de la plataforma. Las dos salidas de verdad son
 * comprimir el escaneo antes de subirlo, o que el navegador le hable al backend DIRECTO, lo que
 * exige que el backend autentique al usuario en vez de a un servicio. Eso ultimo es el camino
 * bueno y ya esta previsto: el dia que exista el login del contribuyente, este archivo se borra
 * — su unica razon de ser es que hoy la autenticacion es una llave compartida.
 *
 * (Hubo un `server.mjs` que hacia esto en un contenedor, sin limite de cuerpo porque reenviaba
 * el cuerpo como flujo. Se puede recuperar de la historia de git si el limite estorba antes de
 * que llegue el login.)
 */

const BACKEND = process.env.DECLARAS_API_URL;
const API_KEY = process.env.DECLARAS_API_KEY;

/** Cabeceras que no se reenvian: las pone la plataforma o las recalcula el destino. */
const NO_REENVIAR = new Set([
  "host",
  "connection",
  "content-length",
  "x-api-key",
  "x-forwarded-host",
  "x-vercel-id",
]);

export default async function handler(request) {
  if (!BACKEND || !API_KEY) {
    // Falla explicito y no con un 500 mudo: sin estas dos variables no hay nada que reenviar, y
    // el sintoma seria una consola que carga y no muestra datos.
    return json(500, {
      code: "PROXY_SIN_CONFIGURAR",
      message: "El servicio no está configurado correctamente.",
      retryable: false,
    });
  }

  const entrante = new URL(request.url);
  const ruta = entrante.pathname.replace(/^\/api/, "") || "/";
  const destino = `${BACKEND}${ruta}${entrante.search}`;

  const cabeceras = new Headers();
  for (const [nombre, valor] of request.headers) {
    if (!NO_REENVIAR.has(nombre.toLowerCase())) cabeceras.set(nombre, valor);
  }
  cabeceras.set("x-api-key", API_KEY);

  const conCuerpo = request.method !== "GET" && request.method !== "HEAD";
  try {
    const respuesta = await fetch(destino, {
      method: request.method,
      headers: cabeceras,
      // El cuerpo va como flujo: por aca suben PDF y leerlos en memoria primero rompe la subida.
      body: conCuerpo ? request.body : undefined,
      duplex: conCuerpo ? "half" : undefined,
      redirect: "manual",
    });

    const salida = new Headers(respuesta.headers);
    salida.delete("content-encoding");
    salida.delete("content-length");
    return new Response(respuesta.body, { status: respuesta.status, headers: salida });
  } catch (error) {
    // El backend caido no es un error del front: se dice cual de los dos es, con un codigo que
    // el cliente de la API ya sabe interpretar.
    console.error("proxy:", error?.message ?? error);
    return json(502, {
      code: "BACKEND_UNAVAILABLE",
      message: "El servicio no está respondiendo. Vuelve a intentar en un momento.",
      retryable: true,
    });
  }
}

function json(status, cuerpo) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
