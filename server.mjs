/**
 * Servidor de produccion: sirve el front y reenvia /api al backend con la llave.
 *
 * POR QUE EXISTE. En desarrollo el proxy de Vite inyecta `X-API-Key` y el navegador nunca la
 * tiene. Ese proxy no existe cuando se publica. Sin algo que cumpla ese papel, la unica forma de
 * que el front hable con el backend es meter la llave en el bundle — y ahi la lee cualquiera que
 * abra las herramientas del navegador. La llave da acceso a declaraciones de renta de personas
 * reales, asi que no.
 *
 * Esto es el mismo proxy, en produccion, y nada mas: la llave vive en la variable de entorno del
 * servidor y el navegador solo ve rutas /api.
 *
 * SIN DEPENDENCIAS, a proposito. Es un intermediario que toca datos tributarios; cada paquete que
 * se agregue acá es superficie que hay que auditar. Node trae todo lo que hace falta.
 *
 * LO QUE ESTO NO ES: autenticacion de usuarios. Cualquiera que alcance esta URL usa el backend
 * con la llave, porque la consola todavia no distingue personas. Sirve para operar el demo con un
 * contador; el dia que entre un contribuyente a ver SU declaracion, la identidad va en la
 * aplicacion (el campo `quien` de cada resolucion ya la esta esperando).
 */

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const DIST = resolve(import.meta.dirname, "dist");
const PORT = Number(process.env.PORT ?? 4173);
const BACKEND = process.env.DECLARAS_API_URL;
const API_KEY = process.env.DECLARAS_API_KEY;

// Se cae al arrancar y no en el primer request: un servidor que arranca sin saber a donde
// reenviar pasa el health check de la plataforma y falla despues, cuando ya nadie esta mirando
// el log del despliegue.
for (const [nombre, valor] of Object.entries({ DECLARAS_API_URL: BACKEND, DECLARAS_API_KEY: API_KEY })) {
  if (!valor) {
    console.error(`Falta la variable ${nombre}. El front no puede hablar con el backend sin ella.`);
    process.exit(1);
  }
}

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

/** Cabeceras que NO se reenvian: las pone el proxy o las recalcula el destino. */
const NO_REENVIAR = new Set(["host", "connection", "content-length", "x-api-key"]);

async function reenviar(req, res) {
  const ruta = req.url.slice("/api".length) || "/";
  const cabeceras = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (!NO_REENVIAR.has(k.toLowerCase())) cabeceras.set(k, Array.isArray(v) ? v.join(", ") : v);
  }
  cabeceras.set("x-api-key", API_KEY);

  const conCuerpo = req.method !== "GET" && req.method !== "HEAD";
  try {
    const respuesta = await fetch(`${BACKEND}${ruta}`, {
      method: req.method,
      headers: cabeceras,
      // El cuerpo va como flujo y no leido en memoria: por acá suben PDF de varios MB, y
      // `duplex: "half"` es lo que Node exige para reenviar un flujo de entrada.
      body: conCuerpo ? req : undefined,
      duplex: conCuerpo ? "half" : undefined,
      redirect: "manual",
    });
    const salida = new Headers(respuesta.headers);
    salida.delete("content-encoding");
    salida.delete("content-length");
    res.writeHead(respuesta.status, Object.fromEntries(salida));
    if (respuesta.body) {
      for await (const trozo of respuesta.body) res.write(trozo);
    }
    res.end();
  } catch (error) {
    // El backend caido no es un 500 del front: se dice cual de los dos es, con el codigo
    // estable que el cliente de la API ya sabe interpretar.
    console.error("proxy:", error?.message ?? error);
    res.writeHead(502, { "content-type": "application/json; charset=utf-8" });
    res.end(
      JSON.stringify({
        code: "BACKEND_UNAVAILABLE",
        message: "El servicio no está respondiendo. Vuelve a intentar en un momento.",
        retryable: true,
      }),
    );
  }
}

async function servirArchivo(res, ruta) {
  const info = await stat(ruta);
  if (!info.isFile()) throw new Error("no es archivo");
  res.writeHead(200, {
    "content-type": TIPOS[extname(ruta)] ?? "application/octet-stream",
    // El index NO se cachea y los assets si: llevan hash en el nombre, asi que un despliegue
    // nuevo cambia el nombre. Cachear el index dejaria a la gente en la version vieja.
    "cache-control": ruta.endsWith("index.html") ? "no-cache" : "public, max-age=31536000, immutable",
  });
  createReadStream(ruta).pipe(res);
}

const servidor = createServer(async (req, res) => {
  if (req.url === "/healthz") {
    res.writeHead(200, { "content-type": "text/plain" }).end("ok");
    return;
  }
  if (req.url.startsWith("/api/") || req.url === "/api") {
    await reenviar(req, res);
    return;
  }

  // `normalize` sobre la ruta pedida y luego `join` desde dist: sin eso, un `..` en la URL sale
  // del directorio publicado y sirve cualquier archivo del contenedor.
  const pedida = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname));
  const candidato = join(DIST, pedida);
  try {
    if (!candidato.startsWith(DIST)) throw new Error("fuera de dist");
    await servirArchivo(res, candidato);
  } catch {
    // Aplicacion de una sola pagina: cualquier ruta que no sea un archivo la resuelve el
    // enrutador del navegador, asi que se devuelve el index.
    try {
      await servirArchivo(res, join(DIST, "index.html"));
    } catch {
      res.writeHead(404, { "content-type": "text/plain" }).end("no encontrado");
    }
  }
});

servidor.listen(PORT, "0.0.0.0", () => {
  console.log(`front en :${PORT} · api -> ${BACKEND}`);
});
