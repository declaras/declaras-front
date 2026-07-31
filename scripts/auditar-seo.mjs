/**
 * Revisa el HTML ya construido, no la pagina en el navegador.
 *
 * La diferencia importa: lo que decide si una pagina se indexa bien es lo que viene en la respuesta
 * del servidor, antes de ejecutar JavaScript. Abrir el sitio en Chrome y ver el titulo correcto no
 * prueba nada, porque Chrome ya ejecuto React. Esto lee los archivos de dist como los leeria un
 * rastreador que no ejecuta nada.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { existsSync } from "node:fs";

import { RUTAS, SITIO } from "./rutas.mjs";

const fallas = [];

// El boton principal del sitio abre WhatsApp, que es el canal del producto. Sin numero configurado
// no lleva a ninguna parte, y un embudo roto en silencio es peor que un build que falla.
if (!process.env.VITE_WHATSAPP) {
  console.warn(
    "\n  AVISO: sin VITE_WHATSAPP el boton principal no abre la conversacion y lleva a la guia.\n" +
      "  Ponlo en las variables del despliegue, solo digitos con indicativo (573001234567).\n",
  );
} else if (!/^\d{10,15}$/.test(process.env.VITE_WHATSAPP)) {
  fallas.push(
    `VITE_WHATSAPP="${process.env.VITE_WHATSAPP}" no parece un numero: van solo digitos, ` +
      "con indicativo de pais y sin signos ni espacios.",
  );
}

// El dominio queda escrito varias veces en el head del index.html, que es estatico y no puede leer
// la constante. Si alguien cambia SITIO y olvida el head, las canonicas y las tarjetas de compartir
// apuntarian al dominio viejo sin que nada falle.
{
  const cabeza = readFileSync("index.html", "utf8");
  const dominio = SITIO.replace(/^https?:\/\//, "");
  const otros = [...cabeza.matchAll(/https?:\/\/([a-z0-9.-]+\.[a-z]{2,})/g)]
    .map((m) => m[1])
    .filter((d) => d !== dominio && !d.includes("fonts.g") && !d.includes("schema.org"));
  if (otros.length) {
    fallas.push(`index.html apunta a ${[...new Set(otros)].join(", ")} y SITIO es ${dominio}`);
  }
}
const dato = (html, re) => html.match(re)?.[1]?.trim() ?? null;

let sinPrerender = 0;
for (const { ruta } of RUTAS) {
  const archivo = ruta === "/" ? "dist/index.html" : join("dist", ruta, "index.html");
  // Sin prerenderizado no hay nada que auditar en esa ruta. Se cuenta y se sigue: el aviso ya lo
  // dio el prerenderizador, y frenar aca solo impediria publicar.
  if (!existsSync(archivo)) {
    sinPrerender += 1;
    continue;
  }
  // Las dos convenciones de los alojamientos estaticos. Sin la plana, pedir la URL canonica
  // devolvia el HTML de la portada.
  if (ruta !== "/" && !existsSync(join("dist", `${ruta}.html`))) {
    fallas.push(`${ruta}: falta dist${ruta}.html, la forma que sirven varios alojamientos`);
  }
  const html = readFileSync(archivo, "utf8");
  const texto = html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ");
  const palabras = texto.split(/\s+/).filter((p) => p.length > 1).length;

  const titulo = dato(html, /<title>([^<]*)<\/title>/);
  const desc = dato(html, /<meta name="description" content="([^"]*)"/);
  const canon = dato(html, /<link rel="canonical" href="([^"]*)"/);
  const h1 = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) =>
    m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
  );
  const h2 = [...html.matchAll(/<h2[^>]*>/g)].length;
  const og = [...html.matchAll(/property="og:/g)].length;
  const ld = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  const tipos = [];
  for (const [, cuerpo] of ld) {
    try {
      const j = JSON.parse(cuerpo);
      const lista = j["@graph"] ?? (Array.isArray(j) ? j : [j]);
      tipos.push(...lista.map((x) => x["@type"]));
    } catch {
      fallas.push(`${ruta}: hay datos estructurados que no son JSON valido`);
    }
  }
  // La cascara sin prerenderizar: el HTML que sale de Vite trae un <div id="root"> vacio, asi que
  // no tiene encabezados ni texto. Auditarla no dice nada util y frenaria el despliegue por algo
  // que ya se aviso arriba.
  if (h1.length === 0 && palabras < 60) {
    sinPrerender += 1;
    continue;
  }

  const sinAlt = [...html.matchAll(/<img(?![^>]*\balt=)[^>]*>/g)].length;

  // La barra de pantallas del prototipo no puede quedar en el HTML indexable: era lo primero que
  // leia un rastreador en la portada.
  const proto = /prototype-mark|screen-tabs|role="tablist"/.test(html);
  const marcador = /\[IMAGEN:/.test(html);
  // Un campo sin etiqueta asociada no tiene nombre accesible: un lector de pantalla lo anuncia como
  // "campo de texto" y tocar su titulo no lo enfoca. Paso con un campo cuya etiqueta era un <small>.
  const campos = [...html.matchAll(/<input\b[^>]*>/g)].filter(
    (m) => !/type="(hidden|checkbox|radio|submit)"/.test(m[0]),
  );
  const sinEtiqueta = campos.filter((m) => {
    const id = m[0].match(/\bid="([^"]+)"/)?.[1];
    if (m[0].includes("aria-label")) return false;
    return !id || !html.includes(`for="${id}"`);
  }).length;

  console.log(`\n${ruta}`);
  console.log(`  title       ${titulo?.length ?? 0} caracteres  ${titulo}`);
  console.log(`  description ${desc?.length ?? 0} caracteres`);
  console.log(`  canonical   ${canon}`);
  console.log(`  h1          ${h1.length}  ${JSON.stringify(h1[0]?.slice(0, 70))}`);
  console.log(`  h2          ${h2}`);
  console.log(`  og / json-ld ${og} etiquetas / ${tipos.join(", ")}`);
  console.log(`  palabras servidas sin ejecutar JavaScript: ${palabras}`);

  if (!titulo || titulo.length < 30 || titulo.length > 65) fallas.push(`${ruta}: title de ${titulo?.length} caracteres (conviene 30 a 65)`);
  if (!desc || desc.length < 70 || desc.length > 165) fallas.push(`${ruta}: description de ${desc?.length} caracteres (conviene 70 a 165)`);
  if (!canon) fallas.push(`${ruta}: sin canonical`);
  else if (canon !== `${SITIO}${ruta}`) fallas.push(`${ruta}: la canonical apunta a ${canon}`);
  if (h1.length !== 1) fallas.push(`${ruta}: ${h1.length} etiquetas h1`);
  if (h1[0] && /[a-z][A-Z]|[a-záéíóú]\$/.test(h1[0])) fallas.push(`${ruta}: el h1 tiene palabras pegadas, "${h1[0]}"`);
  if (og < 6) fallas.push(`${ruta}: solo ${og} etiquetas Open Graph`);
  if (!tipos.length) fallas.push(`${ruta}: sin datos estructurados`);
  if (palabras < 300) fallas.push(`${ruta}: solo ${palabras} palabras en el HTML servido`);
  if (sinAlt) fallas.push(`${ruta}: ${sinAlt} imagen(es) sin atributo alt`);
  if (sinEtiqueta) fallas.push(`${ruta}: ${sinEtiqueta} campo(s) sin etiqueta asociada`);
  if (proto) fallas.push(`${ruta}: el HTML trae la barra de pantallas del prototipo`);
  if (marcador) fallas.push(`${ruta}: hay texto de marcador de posicion "[IMAGEN: ...]" en el HTML`);
}

if (sinPrerender) {
  console.warn(
    `\n  AVISO: ${sinPrerender} ruta(s) sin prerenderizar, asi que llegan vacias a un rastreador.\n`,
  );
}

if (fallas.length) {
  console.error(`\nauditoria SEO: ${fallas.length} problema(s)`);
  for (const f of fallas) console.error("  " + f);
  process.exit(1);
}
console.log("\nauditoria SEO: todo en orden");
