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

/**
 * Las bandas de sueldo con las que se contesta el tope de ingresos SIN hacer cuentas.
 *
 * ═══ POR QUE NO SE PREGUNTA EL TOTAL DEL AÑO ═══
 *
 * El tope son $69.718.600 de ingresos BRUTOS del año, y nadie sabe su bruto anual de memoria:
 * medido, la primera pregunta le tomaba 39 segundos a quien la contestaba (las cuatro siguientes,
 * entre 4 y 8). Lo que todo el mundo sabe al instante es cuanto le pagan al mes.
 *
 * ═══ EL FACTOR, Y POR QUE NO ES 12 ═══
 *
 * Un asalariado con sueldo mensual S recibe al año bastante mas que 12 S:
 *
 *     12 S    salarios
 *    + 1 S    prima de servicios (30 dias)
 *    + 1 S    auxilio de cesantias (se realiza al consignarse al fondo, art. 56-2 ET)
 *    + 0,12 S intereses sobre cesantias (12% anual)
 *    ─────────
 *      14,12 S
 *
 * DIVIDIR EL TOPE POR 12 ERA EL BUG. La ayuda decia "equivale a ganar $5.809.883 al mes, con
 * primas y cesantias", que es el tope / 12. Quien gana $5.000.000 de sueldo leia eso, concluia
 * que ganaba menos y contestaba NO, cuando su bruto real es $70.600.000 y SI esta obligado. Ese
 * falso "no te toca" no nos cuesta a nosotros: le cuesta la sancion a la persona.
 *
 * ═══ HACIA QUE LADO SE FALLA ═══
 *
 * La banda del medio dice "hay que mirarlo", no "no". Decirle "no te toca" a alguien obligado le
 * cuesta plata; mandarlo a que le revisemos el caso cuando no hacia falta no le cuesta nada. Por
 * eso el corte de abajo lleva margen: $4.000.000 al mes son $56.480.000 al año, el 81% del tope.
 *
 * PENDIENTE DE VALIDAR con el tributarista: el 14,12 asume asalariado. Un independiente por
 * honorarios no tiene prima ni cesantias, asi que su factor es 12 y su sueldo de corte queda en
 * $5.809.883. Aplicarle 14,12 a todos empuja a algunos independientes a "hay que mirarlo"
 * estando por debajo, que es el error inofensivo.
 */
export const FACTOR_ANUAL_ASALARIADO = 14.12;

export const BANDAS_INGRESO = [
  {
    id: "baja",
    hasta: 4_000_000,
    etiqueta: "Menos de $4 millones",
    veredicto: "no",
  },
  {
    id: "media",
    desde: 4_000_000,
    hasta: 5_000_000,
    etiqueta: "Entre $4 y $5 millones",
    veredicto: "filo",
  },
  {
    id: "alta",
    desde: 5_000_000,
    etiqueta: "Más de $5 millones",
    veredicto: "si",
  },
];

/** Lo que una banda implica al año, para poder mostrarle la cuenta a quien la quiera ver. */
export const anualDeBanda = (banda) =>
  Math.round((banda.hasta ?? banda.desde) * FACTOR_ANUAL_ASALARIADO);

/** El tope en pesos, con la UVT del año gravable. */
export const topeEnPesos = (tope) => pesos(tope.uvt * UVT_2025);

/**
 * El precio, con su ancla. UN SOLO LUGAR: aparece en los dos heroes, en la tarjeta de precio y en
 * el cierre de la consulta, y dos cifras distintas en la misma pagina es lo que hace cerrar la
 * pestaña. `LISTA` es el precio de referencia sin descuento; si la promocion termina, se iguala
 * a `AHORA` y todos los tachados desaparecen solos.
 */
export const PRECIO = { AHORA: 50_000, LISTA: 150_000 };
