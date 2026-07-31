/**
 * Seis comprobaciones de estilos que se hacen antes de cada build.
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
 * Se aplica a LAS DOS hojas, cada una contra los archivos que la pintan: `consola.css` contra
 * `src/consola`, y `styles.css` contra `src/App.jsx`. Al principio solo cubria la primera, por miedo
 * a que el sitio publico pintara desde HTML; se verifico que `index.html` no trae ni una clase, asi
 * que el emparejamiento tambien es completo ahi. Y hacia falta: al cambiar la imagen de una seccion
 * quedaron `.process-phone-stage` y `.process-phone-art` sin nadie que las use, y esta comprobacion
 * no las vio porque miraba la hoja equivocada.
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
 * La quinta y la sexta se agregaron despues de que las cuatro primeras dejaran pasar dos errores
 * que si dolieron. La quinta: una regla base escrita mas abajo que el `@media` que la ajusta gana
 * por orden, asi que el ajuste no aplica y nada avisa (paso con `.hero-fono` y con los ganchos del
 * hero, que en telefono salian con las medidas de escritorio). La sexta: una llave descuadrada, que
 * es lo que deja al cortar el archivo por indice; el build la reporta como "Missing opening {" sin
 * decir donde, y encontrarla a mano cuesta lo que costo escribir esto.
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
const CONTENIDO = "src/contenido";
const COMUN = "src/comun";
const PROTOTIPO = "src/prototipo";

// Compartidas a proposito: la marca es una sola en las dos partes del producto.
// `money` es una utilidad del sistema de diseño (numeros tabulares), no una pieza de una
// pantalla: la usan las dos partes del producto a proposito.
const COMPARTIDAS_A_PROPOSITO = new Set(["logo", "logo-word", "logo-dot", "logo-light", "money"]);

const clasesDe = (ruta) => {
  const contenido = readFileSync(ruta, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    // Las URLs se van antes de buscar clases: de `fonts.googleapis.com` salían `.googleapis` y
    // `.com` como si fueran selectores, y la comprobación de reglas muertas las reportaba.
    .replace(/url\([^)]*\)/g, "")
    .replace(/@import[^;]*;/g, "");
  return new Set([...contenido.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]));
};

/**
 * Clases que el JSX aplica de verdad.
 *
 * Hay que leer la expresion completa de cada `className`, con las llaves balanceadas, y sacar
 * los literales de ahi adentro. Buscar comillas sueltas por el archivo trae cualquier ternario
 * de texto ("cosa" : "cosas") y llena el aviso de ruido hasta volverlo inutil.
 */
const clasesUsadas = (archivos) => {
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

  for (const archivo of archivos) {
    const contenido = readFileSync(archivo, "utf8");

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
 * Todas las reglas de una hoja, con el contexto de at-rule que las envuelve, la linea y las
 * propiedades que declaran. Es la base de las comprobaciones cuarta y quinta, que preguntan cosas
 * distintas sobre la misma lectura.
 *
 * Los comentarios se reemplazan por espacios en vez de borrarse, para que las lineas sigan
 * cuadrando con el archivo y el aviso pueda decir donde mirar.
 */
const desbalance = [];

const reglasDe = (ruta) => {
  const css = readFileSync(ruta, "utf8").replace(/\/\*[\s\S]*?\*\//g, (c) =>
    c.replace(/[^\n]/g, " "),
  );
  const reglas = [];
  const contexto = [];
  let prelude = "";
  const sueltas = [];
  let cuerpo = null;
  let linea = 1;

  for (let i = 0; i < css.length; i += 1) {
    const caracter = css[i];
    if (caracter === "\n") linea += 1;
    if (caracter === "{") {
      const cabeza = prelude.trim().replace(/\s+/g, " ");
      prelude = "";
      if (cabeza.startsWith("@")) {
        contexto.push(cabeza);
      } else {
        // El prelude entero, con las comas normalizadas para que el mismo grupo escrito con
        // distinto espaciado no pase por dos reglas diferentes.
        const selector = cabeza.replace(/\s*,\s*/g, ", ");
        cuerpo = { selector, envoltorios: contexto.filter(Boolean).slice(), linea, texto: "" };
        contexto.push(null);
      }
    } else if (caracter === "}") {
      // Un cierre sin apertura: `pop()` sobre la pila vacia devuelve undefined sin quejarse, asi
      // que hay que preguntarlo. Es el error que se comete al cortar el archivo por indice, y el
      // build lo reporta sin numero de linea.
      if (!contexto.length) sueltas.push(linea);
      const cerrado = contexto.pop();
      if (cerrado === null && cuerpo) {
        if (cuerpo.selector) reglas.push(cuerpo);
        cuerpo = null;
      }
      prelude = "";
    } else if (caracter === ";" && contexto.length === 0) {
      // Un `@import` o `@charset` de nivel superior: no abre bloque.
      prelude = "";
    } else if (cuerpo) {
      cuerpo.texto += caracter;
    } else {
      prelude += caracter;
    }
  }
  if (contexto.length || sueltas.length) {
    desbalance.push(
      ...sueltas.map((l) => `${ruta}: llave de cierre sin apertura en la linea ${l}`),
      ...(contexto.length ? [`${ruta}: ${contexto.length} bloque(s) sin cerrar al final`] : []),
    );
  }
  for (const regla of reglas) {
    regla.propiedades = new Set(
      [...regla.texto.matchAll(/(?:^|;)\s*(-?[a-zA-Z][\w-]*)\s*:/g)].map((m) => m[1]),
    );
  }
  return reglas;
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
  const vistos = new Set();
  const repetidos = new Map();
  for (const { selector, envoltorios } of reglasDe(ruta)) {
    const clave = `${envoltorios.join(" ")}|${selector}`;
    if (vistos.has(clave)) repetidos.set(clave, selector);
    else vistos.add(clave);
  }
  return [...repetidos.values()].sort();
};

/**
 * Reglas base escritas DESPUES del `@media` que pretende ajustarlas.
 *
 * Con la misma especificidad gana la ultima, asi que una base al final del archivo le pisa en
 * silencio las propiedades al bloque de telefono. Nada falla y el CSS se ve correcto leyendolo por
 * partes: hay que tener las dos posiciones en la cabeza al mismo tiempo para verlo.
 *
 * Ya paso dos veces. `@media (max-width: 980px)` iba despues del de 680 y le devolvia al hero el
 * espacio superior, con el logo montado sobre el titulo. Y `.hero-fono` estaba definida al final,
 * asi que en telefono no aplicaban ni su `padding: 0` ni su `max-height`, y el aparato salia con
 * 525 pixeles de alto en un hueco de 200.
 *
 * SOLO AVISA SI COMPARTEN ALGUNA PROPIEDAD. Una base posterior que declara cosas distintas a las
 * del `@media` no pisa nada, y avisar de eso llenaria el reporte de ruido.
 */
const FAMILIAS = ["padding", "margin", "border", "background", "font", "grid", "gap", "inset",
                  "flex", "transition", "animation", "overflow", "place", "align", "justify"];

const familiasDe = (propiedades) => {
  const claves = new Set();
  for (const propiedad of propiedades) {
    claves.add(propiedad);
    // `padding-top` lo pisa un `padding` de mas abajo, asi que cuentan como la misma cosa.
    for (const familia of FAMILIAS) {
      if (propiedad.startsWith(`${familia}-`)) claves.add(familia);
    }
  }
  return claves;
};

const basesTardias = (ruta) => {
  const reglas = reglasDe(ruta);
  const enMedia = new Map();
  for (const regla of reglas) {
    if (!regla.envoltorios.some((e) => e.startsWith("@media"))) continue;
    if (!enMedia.has(regla.selector)) enMedia.set(regla.selector, []);
    enMedia.get(regla.selector).push(regla);
  }

  const conflictos = [];
  for (const regla of reglas) {
    if (regla.envoltorios.length) continue;
    for (const ajuste of enMedia.get(regla.selector) ?? []) {
      if (ajuste.linea > regla.linea) continue;
      const propias = familiasDe(regla.propiedades);
      const pisadas = [...familiasDe(ajuste.propiedades)].filter((p) => propias.has(p));
      if (pisadas.length) {
        conflictos.push(
          `${regla.selector}   base en la linea ${regla.linea}, ajustada antes en la ${ajuste.linea}` +
            ` (${ajuste.envoltorios.join(" ")}): ${pisadas.sort().join(", ")}`,
        );
      }
    }
  }
  return conflictos.sort();
};

const sitio = clasesDe(SITIO);
const aplicacion = clasesDe(APLICACION);
const definidas = new Set([...sitio, ...aplicacion]);

const chocan = [...aplicacion]
  .filter((clase) => sitio.has(clase) && !COMPARTIDAS_A_PROPOSITO.has(clase))
  .sort();
const JSX_DE_LA_CONSOLA = readdirSync(COMPONENTES)
  .filter((f) => f.endsWith(".jsx"))
  .map((f) => join(COMPONENTES, f));
/**
 * Los archivos que pintan con `styles.css`. Al principio era solo `App.jsx`; cuando se agrego la
 * guia de renta, la comprobacion de reglas muertas reporto veintitantas clases vivas porque miraba
 * la lista incompleta. Si aparece otra pagina que use esta hoja, va aca.
 */
const ARCHIVOS_DEL_SITIO = [
  "src/App.jsx",
  ...[CONTENIDO, COMUN, PROTOTIPO].flatMap((carpeta) =>
    readdirSync(carpeta)
      .filter((f) => f.endsWith(".jsx"))
      .map((f) => join(carpeta, f)),
  ),
];
const JSX_DEL_SITIO = ARCHIVOS_DEL_SITIO;

const deLaConsola = clasesUsadas(JSX_DE_LA_CONSOLA);
const delSitio = clasesUsadas(JSX_DEL_SITIO);
const usadas = deLaConsola.encontradas;
const sinEstilo = [...usadas].filter((clase) => !definidas.has(clase)).sort();

/**
 * Una clase que el JSX puede estar armando en tiempo de ejecucion no se puede declarar muerta.
 *
 * Los prefijos se toman de LOS ARCHIVOS DE ESA HOJA. Con los de la consola nada mas,
 * `.traffic-amber` salia como muerta (se arma con `traffic-${color}` en App.jsx) y borrarla habria
 * roto el semaforo del sitio.
 */
const laArmanEn = (prefijos, clase) => [...prefijos].some((p) => clase.startsWith(p));

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
/** Todo el texto de unos archivos, para la pregunta conservadora de si una regla esta muerta. */
const textoDe = (rutas) => rutas.map((r) => readFileSync(r, "utf8")).join("\n");

const DE_LA_CONSOLA = textoDe(
  readdirSync(COMPONENTES)
    .filter((f) => f.endsWith(".jsx") || f.endsWith(".js"))
    .map((f) => join(COMPONENTES, f)),
);
const DEL_SITIO = textoDe([...ARCHIVOS_DEL_SITIO, "src/main.jsx", "src/seo/Seo.jsx"]);

const seNombraEn = (texto, clase) =>
  new RegExp(`["'\`\\s.]${clase.replaceAll("-", "\\-")}["'\`\\s]`).test(texto);

/** Las reglas de una hoja que ya no usa nadie de los archivos que la pintan. */
const muertasEn = (clasesDeLaHoja, texto, prefijos, otraHoja) =>
  [...clasesDeLaHoja]
    .filter(
      (clase) =>
        !otraHoja.has(clase) && !laArmanEn(prefijos, clase) && !seNombraEn(texto, clase),
    )
    .sort();

const sinUsar = [
  ...muertasEn(aplicacion, DE_LA_CONSOLA, deLaConsola.prefijos, sitio).map((c) => [
    c,
    APLICACION,
  ]),
  ...muertasEn(sitio, DEL_SITIO, delSitio.prefijos, aplicacion).map((c) => [c, SITIO]),
];
if (sinUsar.length) {
  console.warn(
    `\n  estilos: ${sinUsar.length} regla(s) que ya no usa ningún componente.\n` +
      `  Ocupan espacio y engañan a quien las lee creyendo que están vivas.\n` +
      sinUsar.map(([c, hoja]) => `    .${c}   (en ${hoja})`).join("\n") +
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

const tardias = [SITIO, APLICACION].flatMap((ruta) =>
  basesTardias(ruta).map((conflicto) => `${conflicto}   (en ${ruta})`),
);
if (tardias.length) {
  console.warn(
    `\n  estilos: ${tardias.length} regla(s) base escritas después del @media que las ajusta.\n` +
      `  Con la misma especificidad gana la última, así que el ajuste no aplica y nada falla.\n` +
      tardias.map((t) => `    ${t}`).join("\n") +
      `\n  Mueve la regla base arriba, antes de los @media.\n`,
  );
}

const roto = [...new Set(desbalance)].sort();
if (roto.length) {
  console.warn(
    `\n  estilos: ${roto.length} llave(s) descuadradas.\n` +
      `  El build falla sin decir donde, y todo lo que venga despues deja de aplicar.\n` +
      roto.map((r) => `    ${r}`).join("\n") +
      "\n",
  );
}

if (!chocan.length && !sinEstilo.length && !repetidos.length && !sinUsar.length && !tardias.length && !roto.length) {
  console.log("estilos: sin colisiones, sin duplicados, sin reglas ni clases huérfanas y sin bases tardías");
}
