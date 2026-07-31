/**
 * Calendario de vencimientos de renta para personas naturales, ano gravable 2025 (se declara en
 * 2026). NO ESTA ESCRITO A MANO: lo genera el motor a partir del Decreto 2229 de 2023, art.
 * 1.6.1.13.2.15, que fija los plazos en DIAS HABILES segun los dos ultimos digitos del NIT sin
 * el digito de verificacion. Por eso hay saltos: el 17 de agosto de 2026 no aparece porque la
 * Asuncion de la Virgen se traslada a ese lunes (Ley 51 de 1983).
 *
 * Cada fila es [digito_a, digito_b, fecha_iso, fecha_en_palabras]. Los dos digitos del par
 * comparten vencimiento, y eso lo verifica el generador antes de escribir el archivo.
 *
 * Para regenerarlo, desde el repo del backend:
 *   uv run python -c "from declaras.tax.vencimientos import vencimiento_de; ..."
 */
export const CALENDARIO_2026 = [
  ["01", "02", "2026-08-12", "12 de agosto de 2026"],
  ["03", "04", "2026-08-13", "13 de agosto de 2026"],
  ["05", "06", "2026-08-14", "14 de agosto de 2026"],
  ["07", "08", "2026-08-18", "18 de agosto de 2026"],
  ["09", "10", "2026-08-19", "19 de agosto de 2026"],
  ["11", "12", "2026-08-20", "20 de agosto de 2026"],
  ["13", "14", "2026-08-21", "21 de agosto de 2026"],
  ["15", "16", "2026-08-24", "24 de agosto de 2026"],
  ["17", "18", "2026-08-25", "25 de agosto de 2026"],
  ["19", "20", "2026-08-26", "26 de agosto de 2026"],
  ["21", "22", "2026-08-27", "27 de agosto de 2026"],
  ["23", "24", "2026-08-28", "28 de agosto de 2026"],
  ["25", "26", "2026-08-31", "31 de agosto de 2026"],
  ["27", "28", "2026-09-01", "1 de septiembre de 2026"],
  ["29", "30", "2026-09-02", "2 de septiembre de 2026"],
  ["31", "32", "2026-09-03", "3 de septiembre de 2026"],
  ["33", "34", "2026-09-04", "4 de septiembre de 2026"],
  ["35", "36", "2026-09-07", "7 de septiembre de 2026"],
  ["37", "38", "2026-09-08", "8 de septiembre de 2026"],
  ["39", "40", "2026-09-09", "9 de septiembre de 2026"],
  ["41", "42", "2026-09-10", "10 de septiembre de 2026"],
  ["43", "44", "2026-09-11", "11 de septiembre de 2026"],
  ["45", "46", "2026-09-14", "14 de septiembre de 2026"],
  ["47", "48", "2026-09-15", "15 de septiembre de 2026"],
  ["49", "50", "2026-09-16", "16 de septiembre de 2026"],
  ["51", "52", "2026-09-17", "17 de septiembre de 2026"],
  ["53", "54", "2026-09-18", "18 de septiembre de 2026"],
  ["55", "56", "2026-09-21", "21 de septiembre de 2026"],
  ["57", "58", "2026-09-22", "22 de septiembre de 2026"],
  ["59", "60", "2026-09-23", "23 de septiembre de 2026"],
  ["61", "62", "2026-09-24", "24 de septiembre de 2026"],
  ["63", "64", "2026-09-25", "25 de septiembre de 2026"],
  ["65", "66", "2026-09-28", "28 de septiembre de 2026"],
  ["67", "68", "2026-10-01", "1 de octubre de 2026"],
  ["69", "70", "2026-10-02", "2 de octubre de 2026"],
  ["71", "72", "2026-10-05", "5 de octubre de 2026"],
  ["73", "74", "2026-10-06", "6 de octubre de 2026"],
  ["75", "76", "2026-10-07", "7 de octubre de 2026"],
  ["77", "78", "2026-10-08", "8 de octubre de 2026"],
  ["79", "80", "2026-10-09", "9 de octubre de 2026"],
  ["81", "82", "2026-10-13", "13 de octubre de 2026"],
  ["83", "84", "2026-10-14", "14 de octubre de 2026"],
  ["85", "86", "2026-10-15", "15 de octubre de 2026"],
  ["87", "88", "2026-10-16", "16 de octubre de 2026"],
  ["89", "90", "2026-10-19", "19 de octubre de 2026"],
  ["91", "92", "2026-10-20", "20 de octubre de 2026"],
  ["93", "94", "2026-10-21", "21 de octubre de 2026"],
  ["95", "96", "2026-10-22", "22 de octubre de 2026"],
  ["97", "98", "2026-10-23", "23 de octubre de 2026"],
  ["99", "00", "2026-10-26", "26 de octubre de 2026"],
];

/** El par al que pertenece un documento. El decreto agrupa 01-02, 03-04 ... 97-98, 99-00. */
export function vencimientoDe(documento) {
  const digitos = String(documento).replace(/\D/g, "");
  if (digitos.length < 2) return null;
  const dos = Number(digitos.slice(-2));
  // El 00 cae en el ultimo par junto al 99, no en el primero.
  const indice = Math.floor(((dos - 1 + 100) % 100) / 2);
  return CALENDARIO_2026[indice] ?? null;
}
