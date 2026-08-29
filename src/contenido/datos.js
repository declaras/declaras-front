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

/**
 * Los cinco topes del articulo 592, con su cifra y la pregunta con que se le averigua a alguien.
 *
 * LAS CIFRAS SE DERIVAN DE LA UVT, no se transcriben. Son las mismas del motor
 * (`tax/obligation.py`), y ahi esta el detalle que casi nadie nota: cuatro topes se comparan con
 * "supera" y el de ingresos con "iguala o supera", porque el art. 592 num. 1 define al NO obligado
 * como quien tuvo ingresos "inferiores a 1.400 UVT". Estar exactamente en el tope ya obliga.
 *
 * EL ORDEN NO ES CASUAL: primero el que mas gente cruza. Como una sola respuesta afirmativa ya
 * decide, poner ingresos de primero termina la consulta en una pregunta para la mayoria.
 */
export const TOPES = [
  {
    id: "ingresos",
    uvt: 1400,
    incluyeElTope: true,
    pregunta: (v) => `¿Tus ingresos de 2025 llegaron a ${v}?`,
    ayuda: (mes) => `Todo lo que te entró en el año, antes de descuentos. Equivale a ganar ${mes} al mes, con primas y cesantías.`,
  },
  {
    id: "patrimonio",
    uvt: 4500,
    incluyeElTope: false,
    pregunta: (v) => `¿Tus bienes valían más de ${v} al 31 de diciembre de 2025?`,
    ayuda: () => "Todo junto: vivienda, carro, ahorros, inversiones. Sin restar deudas.",
  },
  {
    id: "consumo_tarjeta",
    uvt: 1400,
    incluyeElTope: false,
    pregunta: (v) => `¿Gastaste más de ${v} con tarjetas de crédito en 2025?`,
    ayuda: () => "La suma de todo lo que pasaste por tus tarjetas de crédito en el año.",
  },
  {
    id: "compras",
    uvt: 1400,
    incluyeElTope: false,
    pregunta: (v) => `¿Tus compras y gastos del año pasaron de ${v}?`,
    ayuda: () => "Todo lo que compraste, con cualquier medio de pago. Cuenta vivienda y vehículos.",
  },
  {
    id: "movimientos",
    uvt: 1400,
    incluyeElTope: false,
    pregunta: (v) => `¿Te consignaron o transfirieron más de ${v} en 2025?`,
    ayuda: () => "Todo lo que entró a tus cuentas, aunque no fuera plata tuya ni ingreso.",
  },
];

/** El tope en pesos, con la UVT del año gravable. */
export const topeEnPesos = (tope) => pesos(tope.uvt * UVT_2025);
