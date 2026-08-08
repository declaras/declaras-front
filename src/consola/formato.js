/** Formato de valores para la consola. Pesos colombianos sin decimales. */

const pesos = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const numero = new Intl.NumberFormat("es-CO");

export const formatMoney = (value) =>
  value === null || value === undefined ? "—" : pesos.format(value);

export const formatNumber = (value) =>
  value === null || value === undefined ? "—" : numero.format(value);

// `YYYY-MM-DD` exacto, sin hora. Es un DÍA DE CALENDARIO, no un instante.
const SOLO_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Una fecha como la lee una persona en Colombia.
 *
 * EL BUG QUE ARREGLA, medido: el vencimiento "2026-10-07" se mostraba como "06 de oct de 2026".
 * `new Date("2026-10-07")` NO es medianoche local: el estándar manda interpretar una fecha sin hora
 * como UTC, y al pasarla a la hora de Colombia (UTC−5) retrocede cinco horas, o sea al día
 * anterior. Toda fecha sin hora del producto salía un día antes.
 *
 * En una fecha de vencimiento eso destruye la confianza: si decimos el 6 y el plazo es el 7, quien
 * lo compare con el portal de la DIAN concluye que nuestras cifras tampoco sirven.
 *
 * Un instante CON hora sí se convierte a hora local, porque ahí la zona es parte del significado
 * ("llegó a las 4 de la tarde"). La distinción es la del dominio: un día de calendario es el mismo
 * en todas las zonas; un momento, no.
 */
export const formatDate = (iso) => {
  if (!iso) return "—";
  const partes = SOLO_FECHA.exec(iso);
  const fecha = partes
    ? new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]))
    : new Date(iso);
  return fecha.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatDateTime = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Nombres de los documentos, dichos como se los diria a la persona a la que pertenecen.
 *
 * "Información exógena" es como se llama en la DIAN y no significa nada para quien no trabaja
 * en esto; lo que es, es la lista de lo que otros reportaron a su nombre.
 */
const DOC_LABELS = {
  RUT: "Tu RUT",
  EXOGENA: "Lo que otros reportaron a tu nombre",
  PRIOR_RETURN: "Tu declaración del año pasado",
  SUGGESTED_RETURN: "El borrador que la DIAN te preparó",
  EINVOICE_SUMMARY: "Tus facturas electrónicas",
  CLIENT_DOCUMENT: "Documento que subiste",
  certificado_intereses_vivienda: "Certificado de intereses de vivienda",
  certificado_prepagada: "Certificado de medicina prepagada",
  certificado_afc: "Certificado de AFC o pensión voluntaria",
  registro_civil: "Registro civil de un dependiente",
  planilla_pila: "Planilla de aportes (PILA)",
  predial: "Impuesto predial",
  recibo_de_pago: "Recibo de pago",
  otro: "Otro documento",
};

export const docLabel = (docType) =>
  DOC_LABELS[docType] ?? docType.replaceAll("_", " ").toLowerCase();

/** En que va la declaracion. */
const STATUS_LABELS = {
  OPEN: "Sin empezar",
  EXTRACTING: "Consultando la DIAN",
  READY_FOR_REVIEW: "Lista para revisar",
  DRAFT_READY: "Borrador listo",
  SUBMITTED: "Presentada",
  CLOSED: "Cerrada",
};

export const statusLabel = (status) => STATUS_LABELS[status] ?? status;

/**
 * Nombres legibles de los campos que producen los lectores.
 *
 * El backend los nombra en inglés porque son identificadores de datos; aquí se traducen
 * porque un contador no tiene por qué leer `tope_consumo_tarjeta`.
 */
const CAMPO_LABELS = {
  reported_id_number: "Identificación a la que reportaron",
  reported_name: "Nombre al que reportaron",
  cutoff_date: "Fecha de corte",
  report_date: "Fecha del reporte",
  tax_year: "Año gravable",
  id_kind_label: "Tipo de documento",
  id_number: "Identificación",
  taxpayer_name: "Nombre del contribuyente",
  tope_ingresos: "Tope: ingresos brutos",
  tope_patrimonio: "Tope: patrimonio bruto",
  tope_consumo_tarjeta: "Tope: consumos con tarjeta",
  tope_movimientos: "Tope: consignaciones y movimientos",
  tope_compras: "Tope: compras y consumos",
  invoice_count: "Facturas procesadas",
  total_net_amount: "Total facturado",
  total_benefit_eligible_amount: "Base de la deducción del 1%",
  form_number: "Número de formulario",
  nit: "NIT",
  verification_digit: "Dígito de verificación",
  collection_office: "Dirección seccional",
  taxpayer_kind: "Tipo de contribuyente",
  id_kind: "Tipo de documento",
  last_name_1: "Primer apellido",
  last_name_2: "Segundo apellido",
  first_name_1: "Primer nombre",
  other_names: "Otros nombres",
  email: "Correo electrónico",
  economic_activity_code: "Actividad económica",
  economic_activity_start_date: "Inicio de actividad",

  // Los certificados que lee el modelo. Sin estas entradas, `campoLabel` cae al reemplazo de
  // guiones bajos y sale "anio gravable", "empleador nit", "cesantias e intereses" — sin tildes y
  // en el vocabulario interno del esquema, no en el del documento que la persona tiene delante.
  anio_gravable: "Año gravable",
  empleador_nit: "NIT del empleador",
  empleador_nombre: "Empleador",
  numero_de_certificados: "Certificados expedidos",
  total_ingresos_brutos: "Total de ingresos brutos",
  salarios: "Salarios",
  cesantias_e_intereses: "Cesantías e intereses",
  prima: "Prima de servicios",
  bonificaciones: "Bonificaciones",
  pensiones_de_jubilacion: "Pensiones de jubilación",
  aportes_salud: "Aportes a salud",
  aportes_pension: "Aportes a pensión",
  retencion: "Retención en la fuente",
  promedio_mensual_6m: "Promedio mensual (6 meses)",
  entidad_nit: "NIT de la entidad",
  entidad_nombre: "Entidad",
  tipo_beneficio: "Tipo de beneficio",
  valor: "Valor",
  certificada: "Certificada",
  discrimina: "Discrimina conceptos",
};

/**
 * TODA CIFRA SE ASUME EN PESOS, salvo estas.
 *
 * Salian crudas —`84000000`— y en un producto tributario eso obliga a contar ceros para saber si
 * son ochenta y cuatro millones u ochocientos cuarenta. El panel de lectura existe para VERIFICAR
 * contra el papel que la persona tiene al lado, y un numero que hay que descifrar no se verifica:
 * se aprueba de afan. Que el contador pueda creerle a la cifra es la razon de ser del panel.
 *
 * Se asume pesos por defecto y se excluye lo que evidentemente no lo es. La lista al reves
 * —enumerar lo que SI es plata— deja crudo cualquier campo nuevo que alguien agregue y nadie se
 * entera; asi, un campo nuevo sale formateado y el error, si lo hay, se ve.
 *
 * Estas tres se excluyen porque pintarlas como plata seria visiblemente absurdo: el año gravable
 * saldria como "$ 2.025".
 */
export const CAMPOS_QUE_NO_SON_PESOS = new Set([
  "anio_gravable",
  "numero_de_certificados",
  "confianza",
]);

export const campoLabel = (nombre) => {
  if (CAMPO_LABELS[nombre]) return CAMPO_LABELS[nombre];
  // Las casillas del formulario 210 llegan como `casilla_29`; el lector ya manda el nombre
  // impreso en el formulario como procedencia del campo, asi que aqui basta el numero.
  const casilla = nombre.match(/^casilla_(\d+)$/);
  if (casilla) return `Casilla ${casilla[1]}`;
  return nombre.replaceAll("_", " ");
};


/**
 * El portal sirve algunos archivos declarando UTF-8 con bytes en ISO-8859-1, asi que ciertos
 * nombres llegan con un caracter irrecuperable. Se muestra el valor tal como llego, porque el
 * panel de lectura existe para ser fiel al documento, pero marcandolo: sin la marca parece un
 * defecto nuestro, y con ella queda claro de donde viene.
 */
const CARACTER_ILEGIBLE = "\ufffd";

export const tieneCaracterIlegible = (valor) =>
  typeof valor === "string" && valor.includes(CARACTER_ILEGIBLE);

export const sinCaracterIlegible = (valor) =>
  String(valor).replaceAll(CARACTER_ILEGIBLE, "·");

/** Fechas y fechas con hora que llegan en ISO desde el backend. */
const ES_FECHA_ISO = /^\d{4}-\d{2}-\d{2}(T|$)/;

export const esFechaIso = (valor) => typeof valor === "string" && ES_FECHA_ISO.test(valor);

export const formatIso = (valor) =>
  valor.includes("T") ? formatDateTime(valor) : formatDate(valor);
