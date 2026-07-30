/**
 * Cuatro comprobaciones de estilos que se hacen antes de cada build.
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
 * La tercera la agregue porque las dos primeras NO atraparon el bug obvio: defini `.memoria` para
 * el panel de la memoria de calculo sin darme cuenta de que ya existia, treinta lineas arriba en
 * el MISMO archivo, como el estilo del enlace que lo abre. La primera comprobacion solo mira
 * colisiones ENTRE las dos hojas; la segunda solo mira clases sin ninguna regla, y esta tenia dos.
 * El `display: inline-flex` del enlace le cayo al panel y las etapas salieron en columnas y
 * centradas verticalmente. Un selector identico declarado dos veces en la misma hoja es siempre
 * un accidente: si se quiso agregar propiedades, van en la regla que ya existe.
 *
 * La cuarta es la simetrica de la segunda, y hacia falta por la misma razon: la segunda encuentra
 * una clase usada en el JSX que no tiene regla (se ve sin forma), y esta encuentra una regla que ya
 * nadie usa (ocupa espacio y engana a quien la lee creyendo que esta viva). Aparecio al mover la
 * linea "Leido con ..." de lugar: `.doc-parser` se quedo en la hoja sin que nada la reclamara.
 *
 * Solo se aplica a `consola.css`, y eso es deliberado: sus clases se usan todas desde `src/consola`,
 * asi que el emparejamiento es completo. El sitio publico pinta desde otros archivos y desde HTML,
 * asi que la misma comprobacion ahi seria casi todo ruido.
 *
 * USA OTRO LECTOR QUE LA SEGUNDA, A PROPOSITO. La segunda pregunta "que clases se aplican" y quiere
 * precision, asi que lee la expresion de cada `className`. Esta pregunta "esta muerta esta regla" y
 * quiere lo contrario: en la duda, dejarla viva. Con el lector preciso reportaba `.etapa-actual`
 * (que se aplica con `clases.push("etapa-actual")`, fuera de un `className`) y `.interruptor-activo`
 * (que vive en un ternario dentro de un template, donde la heuristica de comillas se pierde). Asi
 * que aca se busca el nombre como texto en cualquier parte del archivo. Una clase nombrada solo en
 * un comentario cuenta como viva, y eso esta bien: el costo de un falso negativo es una regla de mas
 * en la hoja; el de un falso positivo es borrar CSS que si se usa.
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
// `money` es una utilidad del sistema de diseño (numeros tabulares), no una pieza de una
// pantalla: la usan las dos partes del producto a proposito.
const COMPARTIDAS_A_PROPOSITO = new Set(["logo", "logo-word", "logo-dot", "logo-light", "money"]);

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
  // Prefijos de clases que se arman en tiempo de ejecucion (`paso-${estado}`). No se puede saber
  // que sufijos existen, asi que se guarda el prefijo: sirve para NO declarar huerfana a
  // `.paso-done` cuando el JSX la construye. Sin esto la cuarta comprobacion reportaba cuarenta y
  // siete reglas, casi todas vivas, y con ese ruido no la lee nadie.
  const prefijos = new Set();

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
      for (const trozo of literal.split(/\s+/)) {
        if (!trozo) continue;
        const interpolacion = trozo.indexOf("${");
        if (interpolacion === -1) {
          if (/^[a-z][\w-]*\w$/i.test(trozo)) encontradas.add(trozo);
          continue;
        }
        // `paso-${estado}` deja el prefijo `paso-`; `${x}-cosa` no deja nada utilizable.
        const prefijo = trozo.slice(0, interpolacion);
        if (/^[a-z][\w-]*$/i.test(prefijo)) prefijos.add(prefijo);
        // Lo que venga despues de la interpolacion puede traer otra clase completa.
        const resto = trozo.slice(interpolacion).replace(/\$\{[^}]*\}/g, " ");
        for (const clase of resto.split(/\s+/)) {
          if (/^[a-z][\w-]*\w$/i.test(clase)) encontradas.add(clase);
        }
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
  return { encontradas, prefijos };
};

/**
 * Selectores declarados dos veces en la misma hoja.
 *
 * SE COMPARA EL SELECTOR COMPLETO SIN PARTIRLO POR COMAS, y eso es la clave de que sirva. La
 * primera version lo partia, y entonces esto salia como duplicado:
 *
 *     .partida-ok, .partida-alerta, .partida-falta { padding-left: 15px; }
 *     .partida-ok { box-shadow: ...; }
 *
 * que es la forma normal y correcta de escribir CSS: lo comun en el grupo, lo propio en cada uno.
 * Con seis avisos falsos de ese tipo la comprobacion no la lee nadie. Comparando el prelude
 * completo, `.paso` y `.paso:last-child` son dos reglas distintas (lo son), el grupo y su miembro
 * son dos reglas distintas (lo son), y `.memoria` dos veces salta.
 *
 * Se lleva el contexto de la at-rule que envuelve cada regla, porque el mismo selector dentro de
 * dos `@media` distintos es CSS adaptativo, no un duplicado.
 */
const selectoresRepetidos = (ruta) => {
  const css = readFileSync(ruta, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const vistos = new Map();
  const repetidos = new Map();
  const contexto = [];
  let prelude = "";

  for (const caracter of css) {
    if (caracter === "{") {
      const cabeza = prelude.trim().replace(/\s+/g, " ");
      prelude = "";
      if (cabeza.startsWith("@")) {
        // Una at-rule con cuerpo: pasa a ser el contexto de las reglas de adentro.
        contexto.push(cabeza);
      } else {
        contexto.push(null);
        // El prelude entero, con las comas normalizadas para que el mismo grupo escrito con
        // distinto espaciado no pase por dos reglas diferentes.
        const selector = cabeza.replace(/\s*,\s*/g, ", ");
        if (selector) {
          const clave = `${contexto.filter(Boolean).join(" ")}|${selector}`;
          if (vistos.has(clave)) repetidos.set(clave, selector);
          else vistos.set(clave, true);
        }
      }
    } else if (caracter === "}") {
      contexto.pop();
      prelude = "";
    } else if (caracter === ";" && contexto.length === 0) {
      // Un `@import` o `@charset` de nivel superior: no abre bloque.
      prelude = "";
    } else {
      prelude += caracter;
    }
  }
  return [...repetidos.values()].sort();
};

const sitio = clasesDe(SITIO);
const aplicacion = clasesDe(APLICACION);
const definidas = new Set([...sitio, ...aplicacion]);

const chocan = [...aplicacion]
  .filter((clase) => sitio.has(clase) && !COMPARTIDAS_A_PROPOSITO.has(clase))
  .sort();
const { encontradas: usadas, prefijos } = clasesUsadas();
const sinEstilo = [...usadas].filter((clase) => !definidas.has(clase)).sort();
/** Una clase que el JSX puede estar armando en tiempo de ejecucion no se puede declarar muerta. */
const laArmaAlguien = (clase) => [...prefijos].some((prefijo) => clase.startsWith(prefijo));

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
/** Todo el texto de los componentes, para la pregunta conservadora de si una regla esta muerta. */
const textoDeLosComponentes = readdirSync(COMPONENTES)
  .filter((f) => f.endsWith(".jsx") || f.endsWith(".js"))
  .map((f) => readFileSync(join(COMPONENTES, f), "utf8"))
  .join("\n");

const seNombraEnAlgunLado = (clase) =>
  new RegExp(`["'\`\\s.]${clase.replaceAll("-", "\\-")}["'\`\\s]`).test(textoDeLosComponentes);

const sinUsar = [...aplicacion]
  .filter(
    (clase) =>
      !usadas.has(clase) &&
      !sitio.has(clase) &&
      !laArmaAlguien(clase) &&
      !seNombraEnAlgunLado(clase),
  )
  .sort();
if (sinUsar.length) {
  console.warn(
    `\n  estilos: ${sinUsar.length} regla(s) de ${APLICACION} que ya no usa ningún componente.\n` +
      `  Ocupan espacio y engañan a quien las lee creyendo que están vivas.\n` +
      sinUsar.map((c) => `    .${c}`).join("\n") +
      "\n",
  );
}

const repetidos = [SITIO, APLICACION].flatMap((ruta) =>
  selectoresRepetidos(ruta).map((selector) => `${selector}   (en ${ruta})`),
);
if (repetidos.length) {
  console.warn(
    `\n  estilos: ${repetidos.length} selector(es) declarados dos veces en la misma hoja.\n` +
      `  El segundo le pisa propiedades al primero, y el primero le pisa el resto a quien lo use.\n` +
      repetidos.map((r) => `    ${r}`).join("\n") +
      `\n  Si querías agregar propiedades, van en la regla que ya existe.\n`,
  );
}

if (!chocan.length && !sinEstilo.length && !repetidos.length && !sinUsar.length) {
  console.log("estilos: sin colisiones, sin duplicados y sin reglas ni clases huérfanas");
}
