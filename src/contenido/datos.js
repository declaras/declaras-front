/**
 * Las constantes del ano gravable y los enlaces entre las paginas del tema.
 *
 * POR QUE EN UN SOLO ARCHIVO: la UVT aparece en las cuatro paginas, y una sola desactualizada
 * convierte todas las cifras en mentira sin que nada falle. Cuando salga la UVT de 2026 se cambia
 * aca. Los valores son los mismos que usa el motor que prepara las declaraciones
 * (`parametros/ag2025.yaml` en el backend), no una transcripcion aparte.
 */

export const UVT_2025 = 49_799;
export const UVT_2026 = 52_374;
export const PUBLICADO = "2026-07-30";

/** Formato colombiano: punto de miles y sin decimales, que es como se leen los pesos. */
export const pesos = (n) => "$" + Math.round(n).toLocaleString("es-CO");

/** En UVT y en pesos, para las tablas donde conviene mostrar los dos. */
export const enUvt = (uvt, uvtDelAnio = UVT_2025) => pesos(uvt * uvtDelAnio);

/**
 * El racimo de paginas. La guia es la pagina principal y las otras tres responden consultas que
 * tienen su propia pagina de resultados en el buscador. Cada una enlaza a las demas: sin eso, una
 * pagina nueva no se descubre y ninguna se apoya en las otras.
 */
export const RACIMO = {
  guia: [
    "/declaracion-de-renta-2026",
    "Declaración de renta 2026: la guía completa",
    "Quién debe declarar, tu fecha límite según la cédula y los topes en pesos.",
  ],
  sancion: [
    "/sancion-por-no-declarar-renta",
    "Sanción por no declarar renta",
    "Cuánto cuesta declarar tarde, cuánto si no declaras y por qué hay un mínimo de $523.740.",
  ],
  deducciones: [
    "/deducciones-declaracion-de-renta",
    "Deducciones y beneficios, con el límite que casi nadie explica",
    "Los topes en pesos y por qué sumar beneficios no siempre baja el impuesto.",
  ],
  paso: [
    "/como-declarar-renta-paso-a-paso",
    "Cómo declarar renta paso a paso",
    "Del portal de la DIAN a la firma, con lo que cada paso puede salir mal.",
  ],
};

/** Las otras paginas del racimo, para el bloque de "sigue leyendo". */
export const otras = (propia) =>
  Object.values(RACIMO).filter(([ruta]) => ruta !== propia);
