/**
 * Reenvia /api/* al backend agregando la llave. Es lo que en desarrollo hace el proxy de Vite.
 *
 * POR QUE EXISTE. Sin esto, la unica forma de que la consola hable con el backend es meter la
 * llave en el bundle, donde la lee cualquiera que abra las herramientas del navegador. Esa llave
 * da acceso a declaraciones de renta de personas reales.
 *
 * POR QUE NO ES UN CATCH-ALL. Estuvo como `api/[...ruta].js` y no funciono: `/api/health` (un
 * segmento) invocaba la funcion y `/api/v1/cases` (dos) daba 404, con el enrutamiento por nombre
 * de archivo dependiendo de detalles del preset. Con un rewrite explicito en `vercel.json` la
 * ruta llega como parametro y no hay nada que adivinar.
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
 * No se tapa con un reintento: es un limite de la plataforma. La salida de verdad es que el
 * navegador le hable al backend DIRECTO, lo que exige que el backend autentique al USUARIO en vez
 * de a un servicio. Ese es el camino bueno y ya esta previsto: el dia que exista el login del
 * contribuyente, este archivo se borra — su unica razon de ser es que hoy la autenticacion es una
 * llave compartida.
 */

const BACKEND = process.env.DECLARAS_API_URL;
const API_KEY = process.env.DECLARAS_API_KEY;

/** Cabeceras que no se reenvian: las pone la plataforma o las recalcula el destino. */
const NO_REENVIAR = new Set([
  "host",
  "connection",
  "content-length",
  "transfer-encoding",
  "x-api-key",
  "x-forwarded-host",
  "x-vercel-id",
  "x-vercel-deployment-url",
]);

export default async function handler(req, res) {
  if (!BACKEND || !API_KEY) {
    // Falla explicito y no con un 500 mudo: sin estas dos variables no hay nada que reenviar, y
    // el sintoma seria una consola que carga y no muestra datos.
    return responder(res, 500, {
      code: "PROXY_SIN_CONFIGURAR",
      message: "El servicio no está configurado correctamente.",
      retryable: false,
    });
  }

  // La ruta original la pasa el rewrite de `vercel.json`; el resto de la query se conserva.
  const entrante = new URL(req.url, "http://interno");
  const ruta = entrante.searchParams.get("ruta") ?? "";
  entrante.searchParams.delete("ruta");
  const query = entrante.searchParams.toString();
  const destino = `${BACKEND}/${ruta}${query ? `?${query}` : ""}`;

  const cabeceras = {};
  for (const [nombre, valor] of Object.entries(req.headers)) {
    if (NO_REENVIAR.has(nombre.toLowerCase())) continue;
    cabeceras[nombre] = Array.isArray(valor) ? valor.join(", ") : valor;
  }
  cabeceras["x-api-key"] = API_KEY;

  try {
    const respuesta = await fetch(destino, {
      method: req.method,
      headers: cabeceras,
      ...cuerpoDe(req),
      redirect: "manual",
    });

    for (const [nombre, valor] of respuesta.headers) {
      // El largo y la codificacion los recalcula la plataforma al reenviar.
      if (nombre === "content-length" || nombre === "content-encoding") continue;
      res.setHeader(nombre, valor);
    }
    res.statusCode = respuesta.status;
    res.end(Buffer.from(await respuesta.arrayBuffer()));
  } catch (error) {
    // El backend caido no es un error del front: se dice cual de los dos es, con un codigo que
    // el cliente de la API ya sabe interpretar.
    console.error("proxy:", error?.message ?? error);
    responder(res, 502, {
      code: "BACKEND_UNAVAILABLE",
      message: "El servicio no está respondiendo. Vuelve a intentar en un momento.",
      retryable: true,
    });
  }
}

/**
 * El cuerpo a reenviar, en la forma que corresponda.
 *
 * Vercel parsea el cuerpo cuando es JSON o formulario simple, y NO cuando es multipart — que es
 * justo el caso de subir un PDF. Asi que hay dos formas y no una: el objeto ya parseado se vuelve
 * a serializar, y el multipart viaja como FLUJO, que es lo que permite subir un archivo sin
 * cargarlo entero en memoria.
 */
function cuerpoDe(req) {
  if (req.method === "GET" || req.method === "HEAD") return {};
  if (req.body !== undefined && req.body !== null && typeof req.body === "object") {
    return { body: JSON.stringify(req.body) };
  }
  return { body: req, duplex: "half" };
}

function responder(res, status, cuerpo) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(cuerpo));
}
