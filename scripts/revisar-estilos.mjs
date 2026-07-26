/**
 * Avisa cuando el sitio publico y la aplicacion definen la misma clase.
 *
 * POR QUE EXISTE: los dos comparten un espacio de nombres global, y el que se cargue de ultimo
 * gana en silencio. Paso con `.avatar`: la aplicacion la definia de 34 pixeles, el sitio de 46
 * con un degradado, y la lista de clientes salia con avatares gigantes sin que nada fallara. Se
 * pierde mas tiempo encontrando eso que escribiendo esta comprobacion.
 *
 * Corre antes de cada build. No falla la construccion: avisa, porque compartir una clase a
 * proposito es legitimo (la marca, por ejemplo) y lo unico que hace falta es que sea una
 * decision y no un accidente.
 */

import { readFileSync } from "node:fs";

const SITIO = "src/styles.css";
const APLICACION = "src/consola/consola.css";

// Compartidas a proposito: la marca es una sola en las dos partes del producto.
const COMPARTIDAS_A_PROPOSITO = new Set(["logo", "logo-word", "logo-dot", "logo-light"]);

const clasesDe = (ruta) => {
  const contenido = readFileSync(ruta, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  return new Set([...contenido.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]));
};

const sitio = clasesDe(SITIO);
const aplicacion = clasesDe(APLICACION);
const chocan = [...aplicacion]
  .filter((clase) => sitio.has(clase) && !COMPARTIDAS_A_PROPOSITO.has(clase))
  .sort();

if (chocan.length === 0) {
  console.log("estilos: sin colisiones entre el sitio público y la aplicación");
} else {
  console.warn(
    `\n  estilos: ${chocan.length} clase(s) definidas en los dos archivos.\n` +
      `  Gana la del archivo que se cargue de último, sin avisar.\n` +
      chocan.map((c) => `    .${c}`).join("\n") +
      `\n  Renómbrala en ${APLICACION}, o agrégala a COMPARTIDAS_A_PROPOSITO si es a propósito.\n`,
  );
}
