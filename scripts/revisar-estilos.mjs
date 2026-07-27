/**
 * Dos comprobaciones de estilos que se hacen antes de cada build.
 *
 * La segunda existe porque paso: al limpiar el CSS corte el archivo por indice y me lleve por
 * delante los estilos de las tarjetas y de las constancias. Nada fallo, nada aviso, y la lista
 * de declaraciones quedo como texto suelto sin forma hasta que alguien la miro. Una clase usada
 * en el JSX que no tiene ninguna regla es siempre un error, y encontrarla cuesta segundos.
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

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const SITIO = "src/styles.css";
const APLICACION = "src/consola/consola.css";
const COMPONENTES = "src/consola";

// Compartidas a proposito: la marca es una sola en las dos partes del producto.
const COMPARTIDAS_A_PROPOSITO = new Set(["logo", "logo-word", "logo-dot", "logo-light"]);

const clasesDe = (ruta) => {
  const contenido = readFileSync(ruta, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  return new Set([...contenido.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]));
};

/**
 * Clases que el JSX aplica de verdad.
 *
 * Hay que leer la expresion completa de cada `className`, con las llaves balanceadas, y sacar
 * los literales de ahi adentro. Buscar comillas sueltas por el archivo trae cualquier ternario
 * de texto ("cosa" : "cosas") y llena el aviso de ruido hasta volverlo inutil.
 */
const clasesUsadas = () => {
  const encontradas = new Set();

  const expresionDesde = (texto, inicio) => {
    let profundidad = 0;
    for (let i = inicio; i < texto.length; i += 1) {
      if (texto[i] === "{") profundidad += 1;
      else if (texto[i] === "}") {
        profundidad -= 1;
        if (profundidad === 0) return texto.slice(inicio + 1, i);
      }
    }
    return "";
  };

  for (const archivo of readdirSync(COMPONENTES).filter((f) => f.endsWith(".jsx"))) {
    const contenido = readFileSync(join(COMPONENTES, archivo), "utf8");

    const anotar = (literal) => {
      // Las interpolaciones se descartan: una clase armada en tiempo de ejecucion no se puede
      // resolver desde aqui.
      for (const clase of literal.replace(/\$\{[^}]*\}/g, " ").split(/\s+/)) {
        if (/^[a-z][\w-]*\w$/i.test(clase)) encontradas.add(clase);
      }
    };

    for (const coincidencia of contenido.matchAll(/className=/g)) {
      const despues = coincidencia.index + "className=".length;
      if (contenido[despues] === "{") {
        // Una expresion: los literales estan adentro, entre comillas o acentos graves.
        const expresion = expresionDesde(contenido, despues);
        for (const [, literal] of expresion.matchAll(/["'`]([^"'`]*)["'`]/g)) anotar(literal);
      } else {
        // Una cadena simple: la cadena entera ES la lista de clases.
        anotar(contenido.slice(despues).match(/^"([^"]*)"/)?.[1] ?? "");
      }
    }
  }
  return encontradas;
};

const sitio = clasesDe(SITIO);
const aplicacion = clasesDe(APLICACION);
const definidas = new Set([...sitio, ...aplicacion]);

const chocan = [...aplicacion]
  .filter((clase) => sitio.has(clase) && !COMPARTIDAS_A_PROPOSITO.has(clase))
  .sort();
const sinEstilo = [...clasesUsadas()].filter((clase) => !definidas.has(clase)).sort();

if (chocan.length) {
  console.warn(
    `\n  estilos: ${chocan.length} clase(s) definidas en los dos archivos.\n` +
      `  Gana la del archivo que se cargue de último, sin avisar.\n` +
      chocan.map((c) => `    .${c}`).join("\n") +
      `\n  Renómbrala en ${APLICACION}, o agrégala a COMPARTIDAS_A_PROPOSITO si es a propósito.\n`,
  );
}
if (sinEstilo.length) {
  console.warn(
    `\n  estilos: ${sinEstilo.length} clase(s) usadas en el JSX sin ninguna regla.\n` +
      `  Se ven como texto suelto sin forma, y nada mas falla.\n` +
      sinEstilo.map((c) => `    .${c}`).join("\n") +
      "\n",
  );
}
if (!chocan.length && !sinEstilo.length) {
  console.log("estilos: sin colisiones y sin clases huérfanas");
}
