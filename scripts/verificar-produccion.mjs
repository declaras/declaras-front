/**
 * Comprueba que lo que esta publicado es lo que se penso publicar.
 *
 * POR QUE EXISTE: un despliegue "en verde" no dice nada sobre lo que quedo servido. Paso dos veces.
 * La primera, Vercel corria `vite build` a secas: el despliegue salio bien y las cuatro guias y el
 * sitemap devolvian 404. La segunda, el prerenderizado se caia por una libreria de sistema que falta
 * en la imagen de construccion, y el sitio quedo publicado con las paginas vacias. En los dos casos
 * la unica pista fue mirar el dominio con curl a mano.
 *
 * Esto lo hace de una: pide cada ruta, comprueba el codigo, que el titulo sea el suyo (y no el de la
 * portada, que es lo que pasa cuando el alojamiento sirve el index.html para todo) y que el HTML
 * traiga contenido de verdad sin ejecutar JavaScript.
 *
 * Se corre a mano contra el dominio publicado:  pnpm run produccion
 */
import { PAGINAS } from "../src/seo/paginas.js";

const SITIO = process.env.SITIO ?? "https://declaras.co";
const problemas = [];

const pedir = async (ruta) => {
  const respuesta = await fetch(SITIO + ruta, { redirect: "follow" });
  return { codigo: respuesta.status, html: await respuesta.text() };
};

const soloTexto = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter((p) => p.length > 1).length;

console.log(`verificando ${SITIO}\n`);

for (const [ruta, meta] of Object.entries(PAGINAS)) {
  const { codigo, html } = await pedir(ruta);
  const titulo = html.match(/<title>([^<]*)<\/title>/)?.[1]?.trim() ?? "";
  const palabras = soloTexto(html);
  const h1 = (html.match(/<h1[ >]/g) ?? []).length;

  console.log(`  ${ruta.padEnd(34)} ${codigo}  ${String(palabras).padStart(5)} palabras  h1=${h1}`);

  if (codigo !== 200) problemas.push(`${ruta} responde ${codigo}`);
  // El titulo de la portada en otra ruta significa que el alojamiento esta sirviendo el index.html
  // para todo, o sea que el prerenderizado no llego. Es el fallo que mas cuesta ver.
  else if (titulo !== meta.titulo) {
    problemas.push(`${ruta} sirve el titulo "${titulo.slice(0, 44)}" y le toca el suyo`);
  }
  if (codigo === 200 && palabras < 300) {
    problemas.push(`${ruta} llega con ${palabras} palabras: sin prerenderizado`);
  }
  if (codigo === 200 && h1 !== 1) problemas.push(`${ruta} tiene ${h1} etiquetas h1`);
}

for (const [ruta, esperado] of [
  ["/sitemap.xml", /<loc>/],
  ["/robots.txt", /Sitemap:/],
  ["/clara-og.jpg", null],
]) {
  const { codigo, html } = await pedir(ruta);
  const bien = codigo === 200 && (esperado === null || esperado.test(html));
  console.log(`  ${ruta.padEnd(34)} ${codigo}  ${bien ? "ok" : "MAL"}`);
  if (!bien) problemas.push(`${ruta} responde ${codigo} o no trae lo que deberia`);
}

if (problemas.length) {
  console.error(`\nproduccion: ${problemas.length} problema(s)`);
  for (const p of problemas) console.error("  " + p);
  process.exit(1);
}
console.log("\nproduccion: todo lo publicado es lo que toca");
