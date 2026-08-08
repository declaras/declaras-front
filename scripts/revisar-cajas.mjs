/**
 * Busca texto aplastado: cajas tan angostas que el contenido sale en una palabra por renglon.
 *
 * POR QUE EXISTE: `.post-pasos li` alcanzaba tambien los `li` de la lista anidada dentro de cada
 * paso, asi que cada vinieta heredaba una rejilla de 46 pixeles y salia en columna, una palabra por
 * linea. Nada fallaba: ni el linter, ni el revisor de estilos, ni la auditoria de SEO, porque el
 * HTML y el CSS eran validos. Solo se veia mirando la pagina.
 *
 * Es el tercer selector que alcanza mas de lo que debia, y los tres se descubrieron por casualidad.
 * Esta comprobacion mide las cajas de texto en el navegador y avisa cuando una es demasiado angosta
 * para lo que contiene. No corre en el build porque necesita un navegador: se corre a mano con
 * `pnpm run cajas` antes de dar algo por bueno.
 */
import { chromium } from "playwright";

import { RUTAS } from "./rutas.mjs";

const BASE = process.env.BASE ?? "http://localhost:5173";
const ANCHOS = [1440, 390];

const navegador = await chromium.launch();
const problemas = [];

for (const ancho of ANCHOS) {
  for (const { ruta } of RUTAS) {
    const pagina = await navegador.newPage({
      viewport: { width: ancho, height: 900 },
      isMobile: ancho < 500,
    });
    await pagina.goto(BASE + ruta, { waitUntil: "networkidle" });
    await pagina.waitForTimeout(700);

    const malas = await pagina.evaluate(() => {
      const medir = (texto, estilo) => {
        // El ancho de la palabra mas larga, con la tipografia real de la caja.
        const lienzo = document.createElement("canvas").getContext("2d");
        lienzo.font = `${estilo.fontWeight} ${estilo.fontSize} ${estilo.fontFamily}`;
        return Math.max(...texto.split(/\s+/).map((p) => lienzo.measureText(p).width));
      };
      const salida = [];
      for (const nodo of document.querySelectorAll("p, li, dd, dt, h1, h2, h3, td, th")) {
        const texto = (nodo.textContent ?? "").trim();
        const palabras = texto.split(/\s+/).filter(Boolean);
        if (palabras.length < 4) continue;
        const caja = nodo.getBoundingClientRect();
        if (caja.width === 0 || caja.height === 0) continue;
        const estilo = getComputedStyle(nodo);
        const masLarga = medir(texto, estilo);
        // La senal sin ambiguedad: no cabe ni la palabra mas larga. Un titular que ocupa dos
        // renglones es normal; una caja mas angosta que su propia palabra, no.
        if (caja.width < masLarga * 1.05) {
          salida.push({
            ancho: Math.round(caja.width),
            necesita: Math.round(masLarga),
            etiqueta: nodo.tagName,
            clase: (nodo.className || "").toString().split(" ")[0],
            texto: texto.slice(0, 42),
          });
        }
      }
      return salida;
    });

    for (const m of malas) {
      problemas.push(`${ruta} @${ancho}px  <${m.etiqueta}.${m.clase}> ${m.ancho}px de ancho, ` +
        `necesita ${m.necesita}  "${m.texto}"`);
    }
    await pagina.close();
  }
}

await navegador.close();

if (problemas.length) {
  console.error(`\ncajas: ${problemas.length} bloque(s) de texto aplastados`);
  for (const p of problemas.slice(0, 12)) console.error("  " + p);
  process.exit(1);
}
console.log(`cajas: sin texto aplastado en ${RUTAS.length} rutas a ${ANCHOS.join(" y ")} px`);
