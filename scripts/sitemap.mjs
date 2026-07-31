/**
 * Genera public/sitemap.xml antes de construir.
 *
 * Se genera en vez de escribirse a mano porque la fecha de modificacion tiene que ser real: un
 * sitemap con fechas viejas o inventadas es peor que no tenerlo, ya que un buscador aprende a
 * ignorarlas.
 */
import { writeFileSync } from "node:fs";
import { modificada, RUTAS, SITIO } from "./rutas.mjs";

const urls = RUTAS.map(
  (entrada) => `  <url>
    <loc>${SITIO}${entrada.ruta}</loc>
    <lastmod>${modificada(entrada)}</lastmod>
    <changefreq>${entrada.frecuencia}</changefreq>
    <priority>${entrada.prioridad}</priority>
  </url>`,
).join("\n");

writeFileSync(
  "public/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`,
);
console.log(`sitemap: ${RUTAS.length} rutas en ${SITIO}`);
