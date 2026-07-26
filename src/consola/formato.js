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

export const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", {
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

/** Nombres legibles de los tipos de documento del portal. */
const DOC_LABELS = {
  RUT: "RUT",
  EXOGENA: "Información exógena",
  PRIOR_RETURN: "Declaración del año anterior",
  SUGGESTED_RETURN: "Borrador sugerido por la DIAN",
  EINVOICE_SUMMARY: "Facturas electrónicas",
};

export const docLabel = (docType) =>
  DOC_LABELS[docType] ?? docType.replaceAll("_", " ").toLowerCase();

/** Estados del expediente, en lenguaje de contador. */
const STATUS_LABELS = {
  OPEN: "Abierto",
  EXTRACTING: "Consultando la DIAN",
  READY_FOR_REVIEW: "Listo para revisar",
  DRAFT_READY: "Borrador listo",
  SUBMITTED: "Presentado",
  CLOSED: "Cerrado",
};

export const statusLabel = (status) => STATUS_LABELS[status] ?? status;

/**
 * Nombres legibles de los campos que producen los lectores.
 *
 * El backend los nombra en inglés porque son identificadores de datos; aquí se traducen
 * porque un contador no tiene por qué leer `tope_consumo_tarjeta`.
 */
const CAMPO_LABELS = {
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
};

export const campoLabel = (nombre) =>
  CAMPO_LABELS[nombre] ?? nombre.replaceAll("_", " ");
