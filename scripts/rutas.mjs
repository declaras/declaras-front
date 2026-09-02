/**
 * Las rutas publicas del sitio, en un solo lugar.
 *
 * De aca salen el sitemap.xml y la lista que el prerenderizador convierte en HTML estatico. Tenerlas
 * duplicadas era la forma seguro de publicar una pagina que no esta en el sitemap, o de prerenderizar
 * una que ya no existe.
 */
import { existsSync, statSync } from "node:fs";

export const SITIO = process.env.VITE_SITIO_URL?.replace(/\/$/, "") ?? "https://declaras.co";

/**
 * Cada ruta declara los archivos que la componen. De ahi sale su fecha de modificacion real.
 *
 * POR QUE NO SE PONE LA FECHA DE HOY: un sitemap que dice que todo cambio hoy, cada vez que se
 * construye, es una senal falsa. Un buscador aprende a ignorar el `lastmod` de quien miente, y
 * entonces deja de servir para lo que existe, que es avisar cuando algo si cambio.
 */
export const RUTAS = [
  {
    ruta: "/",
    prioridad: "1.0",
    frecuencia: "weekly",
    fuentes: ["src/App.jsx", "src/comun/Marco.jsx", "index.html"],
  },
  {
    ruta: "/te-toca-declarar",
    prioridad: "0.9",
    frecuencia: "weekly",
    fuentes: ["src/App.jsx", "src/comun/Consulta.jsx", "src/comun/Marco.jsx"],
  },
  {
    ruta: "/declaracion-de-renta-2026",
    prioridad: "0.9",
    frecuencia: "monthly",
    fuentes: [
      "src/contenido/GuiaRenta2026.jsx",
      "src/contenido/calendario-renta-2026.js",
      "src/contenido/datos.js",
      "src/comun/Vencimiento.jsx",
    ],
  },
  {
    ruta: "/sancion-por-no-declarar-renta",
    prioridad: "0.8",
    frecuencia: "monthly",
    fuentes: ["src/contenido/SancionRenta.jsx", "src/contenido/datos.js"],
  },
  {
    ruta: "/deducciones-declaracion-de-renta",
    prioridad: "0.8",
    frecuencia: "monthly",
    fuentes: ["src/contenido/Deducciones.jsx", "src/contenido/datos.js"],
  },
  {
    // Prioridad baja y frecuencia anual a proposito: es una pagina que tiene que EXISTIR y ser
    // encontrable, no una por la que compitamos en buscadores. Lo que no puede es faltar, porque
    // la casilla obligatoria de la consulta enlaza aca y estaba cayendo en 404.
    ruta: "/terminos",
    prioridad: "0.3",
    frecuencia: "yearly",
    fuentes: ["src/contenido/Legal.jsx"],
  },
  {
    ruta: "/como-declarar-renta-paso-a-paso",
    prioridad: "0.8",
    frecuencia: "monthly",
    fuentes: ["src/contenido/PasoAPaso.jsx", "src/contenido/datos.js"],
  },
];

/** La fecha del archivo mas reciente de los que componen la ruta, en formato ISO corto. */
export function modificada({ fuentes }) {
  const cuando = fuentes
    .map((f) => (existsSync(f) ? statSync(f).mtimeMs : 0))
    .reduce((a, b) => Math.max(a, b), 0);
  return new Date(cuando || Date.now()).toISOString().slice(0, 10);
}
