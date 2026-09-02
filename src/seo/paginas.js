/**
 * Los metadatos de cada ruta, en un solo lugar.
 *
 * POR QUE EXISTE: el componente de SEO escribe el `<head>` en un efecto, y los efectos no corren al
 * renderizar en el servidor. Sin esta tabla, el prerenderizado producia el cuerpo de cada pagina
 * pero con la cabecera de la portada, o sea cinco paginas compitiendo por la misma consulta.
 *
 * Lo lee el navegador (a traves del componente de SEO) y lo lee el prerenderizado. Una sola fuente,
 * asi que un titulo no puede quedar distinto en el HTML servido y en la pagina ya cargada.
 */

export const SITIO = (import.meta.env?.VITE_SITIO_URL ?? "https://declaras.co").replace(/\/$/, "");

const PUBLICADO = "2026-07-30";

export const PAGINAS = {
  "/": {
    titulo: "Declaración de renta 2026 por WhatsApp, por $50.000 | Clara",
    descripcion:
      "Clara deja tu declaración de renta lista para revisar y firmar. Todo por WhatsApp, un solo pago de $50.000. Te decimos gratis si debes declarar.",
    imagen: "/clara-og.jpg",
    tipo: "website",
  },
  "/te-toca-declarar": {
    titulo: "¿Te toca declarar renta en 2026? Averígualo gratis | Clara",
    descripcion:
      "Contesta cinco preguntas o consulta con tu clave de la DIAN y te decimos gratis si estás obligado a declarar renta este año, con tu fecha límite exacta.",
    imagen: "/clara-og.jpg",
    tipo: "website",
  },
  "/declaracion-de-renta-2026": {
    titulo: "Declaración de renta 2026: topes y fechas por cédula | Clara",
    descripcion:
      "Los cinco topes en pesos, tu fecha límite según los dos últimos dígitos de la cédula y el límite del 40% que decide cuánto baja tu impuesto.",
    imagen: "/clara-og-renta-2026.jpg",
    tipo: "article",
    publicado: PUBLICADO,
    migaja: "Declaración de renta 2026",
    h1: "Declaración de renta 2026 en Colombia: quién debe declarar, fechas por cédula y cómo hacerla",
  },
  // NO LLEVA `tipo: "article"` NI `publicado`: no es contenido editorial, es el documento
  // vigente. Marcarlo como articulo con fecha invita a que un buscador muestre "publicado el
  // ..." sobre unas condiciones de servicio, que es justo lo que no se quiere decir.
  "/terminos": {
    titulo: "Términos y política de datos | Clara",
    descripcion:
      "Las condiciones del servicio de Clara y qué hacemos con tus datos personales, incluida tu clave de la DIAN. Escrito para que se pueda leer.",
    migaja: "Términos y política de datos",
    h1: "Términos y política de datos",
  },
  "/sancion-por-no-declarar-renta": {
    titulo: "Sanción por no declarar renta en 2026: cuánto es | Clara",
    descripcion:
      "Cuánto cuesta presentar tarde, qué pasa si no presentas y por qué hay sanción incluso cuando no te resultaba impuesto a pagar. Con la mínima de 2026 en pesos.",
    imagen: "/clara-og-sancion.jpg",
    tipo: "article",
    publicado: PUBLICADO,
    migaja: "Sanción por no declarar",
    h1: "Sanción por no declarar renta en Colombia: cuánto es y cómo se calcula",
  },
  "/deducciones-declaracion-de-renta": {
    titulo: "Deducciones de renta 2026: topes en pesos y el límite | Clara",
    descripcion:
      "Los topes de cada deducción en pesos y el límite del 40% del artículo 336, que decide cuánto baja de verdad tu impuesto. Con calculadora de cupo.",
    imagen: "/clara-og-deducciones.jpg",
    tipo: "article",
    publicado: PUBLICADO,
    migaja: "Deducciones y beneficios",
    h1: "Deducciones en la declaración de renta de personas naturales: los topes y el límite que manda",
  },
  "/como-declarar-renta-paso-a-paso": {
    titulo: "Cómo declarar renta paso a paso en 2026 | Clara",
    descripcion:
      "Los siete pasos para declarar renta por internet en el portal de la DIAN, y lo que suele salir mal en cada uno. Con lo que hay que tener listo antes de entrar.",
    imagen: "/clara-og-paso-a-paso.jpg",
    tipo: "article",
    publicado: PUBLICADO,
    migaja: "Cómo declarar paso a paso",
    h1: "Cómo declarar renta paso a paso en 2026, y lo que sale mal en cada paso",
  },
};

/** Escapa lo que va dentro de un atributo del HTML. */
const esc = (t) =>
  String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Las etiquetas del `<head>` de una ruta, como texto.
 *
 * La usa el prerenderizado. El navegador usa el componente de SEO, que pone lo mismo pero a traves
 * del DOM. Los dos leen esta tabla, asi que no pueden discrepar.
 */
export function cabezaDe(ruta, datos = null) {
  const p = PAGINAS[ruta];
  if (!p) return "";
  const url = `${SITIO}${ruta}`;
  const imagen = `${SITIO}${p.imagen}`;
  const t = [
    `<title>${esc(p.titulo)}</title>`,
    `<meta name="description" content="${esc(p.descripcion)}" />`,
    `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:title" content="${esc(p.titulo)}" />`,
    `<meta property="og:description" content="${esc(p.descripcion)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:type" content="${p.tipo}" />`,
    `<meta property="og:image" content="${imagen}" />`,
    `<meta property="og:site_name" content="Clara" />`,
    `<meta property="og:locale" content="es_CO" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(p.titulo)}" />`,
    `<meta name="twitter:description" content="${esc(p.descripcion)}" />`,
    `<meta name="twitter:image" content="${imagen}" />`,
  ];
  if (p.publicado) {
    t.push(`<meta property="article:published_time" content="${p.publicado}" />`);
    t.push(`<meta property="article:modified_time" content="${p.publicado}" />`);
  }
  if (datos) {
    t.push(`<script type="application/ld+json" data-seo="ruta">${JSON.stringify(datos)}</script>`);
  }
  return t.join("\n    ");
}
