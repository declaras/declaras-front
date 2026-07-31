/**
 * Convierte cada ruta publica en HTML estatico despues de construir.
 *
 * POR QUE HACE FALTA: el sitio es una sola pagina de React. El HTML que sale del build trae un
 * <div id="root"> vacio, y todo el contenido, los encabezados y los datos estructurados aparecen
 * solo cuando el navegador ejecuta el JavaScript. Google suele renderizar, pero lo hace en una
 * segunda pasada, con retraso y sin garantia, y el resto de los rastreadores (los de WhatsApp,
 * X o LinkedIn, que son los que arman la tarjeta al compartir un enlace) NO ejecutan JavaScript.
 * Sin este paso, compartir la guia por WhatsApp mostraba el titulo de la portada.
 *
 * Lo que hace es abrir cada ruta en un navegador real contra los archivos ya construidos, esperar
 * a que React termine, y guardar el HTML resultante en su propia carpeta. El JavaScript se sigue
 * cargando despues, asi que la pagina queda igual de interactiva: la calculadora de la fecha
 * funciona lo mismo. La diferencia es que el contenido ya venia en la respuesta.
 */
import { createServer } from "node:http";
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { chromium } from "playwright";

import { RUTAS } from "./rutas.mjs";

const DIST = "dist";
const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
  ".txt": "text/plain",
};

/** Un servidor minimo sobre dist, porque un `file://` no permite rutas de History API. */
const servidor = createServer((peticion, respuesta) => {
  const limpia = decodeURIComponent(peticion.url.split("?")[0]);
  const candidato = join(DIST, limpia);
  const archivo = existsSync(candidato) && extname(candidato) ? candidato : join(DIST, "index.html");
  respuesta.writeHead(200, { "Content-Type": TIPOS[extname(archivo)] ?? "application/octet-stream" });
  respuesta.end(readFileSync(archivo));
});

const puerto = await new Promise((listo) => {
  servidor.listen(0, () => listo(servidor.address().port));
});

const navegador = await chromium.launch();
const pagina = await navegador.newPage();
const problemas = [];
pagina.on("pageerror", (e) => problemas.push(String(e)));

for (const { ruta } of RUTAS) {
  await pagina.goto(`http://127.0.0.1:${puerto}${ruta}`, { waitUntil: "networkidle" });
  // El componente de SEO escribe el head en un efecto, asi que hay que esperarlo.
  await pagina.waitForFunction(() => !!document.querySelector('link[rel="canonical"]'), { timeout: 15000 });
  await pagina.waitForTimeout(400);

  const html = await pagina.content();
  const encabezados = await pagina.evaluate(() => document.querySelectorAll("h1").length);
  // SE ESCRIBEN LAS DOS FORMAS, y no es redundancia. Los alojamientos estaticos se reparten entre
  // dos convenciones para una URL sin extension: unos buscan `ruta/index.html` y otros `ruta.html`.
  // Con solo la primera, pedir `/declaracion-de-renta-2026` (que es justo la URL canonica) devolvia
  // el HTML de la portada, con su titulo y su contenido. Un rastreador habria visto dos direcciones
  // sirviendo lo mismo y ninguna de las dos habria sido la guia.
  const destinos =
    ruta === "/"
      ? [join(DIST, "index.html")]
      : [join(DIST, ruta, "index.html"), join(DIST, `${ruta}.html`)];
  for (const salida of destinos) {
    mkdirSync(join(salida, ".."), { recursive: true });
    writeFileSync(salida, html);
  }

  const kb = Math.round(html.length / 1024);
  if (encabezados !== 1) problemas.push(`${ruta}: ${encabezados} etiquetas h1 (debe haber una)`);
  console.log(`  ${ruta.padEnd(30)} ${String(kb).padStart(4)} kB   h1=${encabezados}`);
}

await navegador.close();
servidor.close();

if (problemas.length) {
  console.error("\nprerender: problemas encontrados");
  for (const p of problemas.slice(0, 6)) console.error("  " + p);
  process.exit(1);
}
console.log(`prerender: ${RUTAS.length} rutas convertidas a HTML estatico`);
