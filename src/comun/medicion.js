/**
 * La etiqueta de Google y la atribucion del clic pago.
 *
 * POR QUE LA ETIQUETA DIRECTA Y NO GOOGLE TAG MANAGER: el gestor de etiquetas resuelve un problema
 * que aca no existe, el de que alguien de mercadeo agregue y quite etiquetas sin pasar por un
 * despliegue. En este sitio hay UNA conversion y UN evento, y quien los toca es quien hace el
 * build. El gestor cobraria un contenedor extra, una capa de indirecciones y otro panel donde
 * mirar cuando algo falle, a cambio de nada. Si algun dia entra un equipo de mercadeo, esta pieza
 * se cambia por el contenedor sin tocar el resto del sitio: todo pasa por las tres funciones de
 * abajo.
 *
 * TODO ESTO ES OPCIONAL. Sin las variables de entorno no se carga ningun script, no se guarda nada
 * y no sale ni una peticion a Google: `iniciarMedicion` corta en el guard antes de tocar el
 * documento.
 *
 * Lo que NO pasa, y conviene no prometerlo: el cuerpo no desaparece del paquete. Vite reemplaza
 * `import.meta.env.VITE_*` por `void 0`, pero esbuild pliega `A || B` y ahi se detiene, asi que
 * `HAY_ETIQUETA` sale como `!!void 0` para evaluar en ejecucion en vez de `false` al construir.
 * Son unos cientos de bytes muertos que nunca se ejecutan. Se midio en el build; no vale la pena
 * torcer el codigo para ahorrarlos.
 *
 * EL RASTRO NUNCA VIAJA EN LA URL DE WHATSAPP, y conviene tenerlo escrito porque es la trampa
 * obvia: `wa.me/573001234567?gclid=...` NO funciona. WhatsApp lee unicamente el parametro `text` y
 * descarta el resto, asi que un identificador puesto como parametro no llega a ninguna parte. La
 * unica via es meterlo DENTRO del mensaje, que es lo que hace `referenciaDeAnuncio`.
 */

const ID_ADS = import.meta.env.VITE_GOOGLE_ADS_ID;
const ETIQUETA_CONVERSION = import.meta.env.VITE_GOOGLE_ADS_CONVERSION_LABEL;
const ID_GA4 = import.meta.env.VITE_GA4_ID;

const HAY_ETIQUETA = Boolean(ID_ADS || ID_GA4);

const LLAVE = "clara:atribucion";

/**
 * Noventa dias es la ventana con la que Google atribuye por defecto una conversion al clic que la
 * origino. Guardar mas tiempo no sirve —Google ya no lo aceptaria— y guardar menos pierde a quien
 * lee la guia en agosto y decide en septiembre, que en esta temporada es la mitad de la gente.
 */
const VIGENCIA_MS = 90 * 24 * 60 * 60 * 1000;

const hayNavegador = () => typeof window !== "undefined";

/**
 * La consola y el ingreso quedan FUERA de la medicion, enteros.
 *
 * POR QUE: son la herramienta de trabajo del contador, no el sitio publico. Ahi no hay ninguna
 * conversion posible —nadie va a abrir una conversacion de ventas desde la pantalla de un
 * expediente— y en cambio si hay datos tributarios de clientes en los titulos y en las rutas. No
 * hay razon para que nada de eso salga hacia Google, y "no medir la herramienta interna" es la
 * unica postura que no obliga a revisar caso por caso que es lo que se esta enviando.
 *
 * Es la misma linea que ya trazan `robots.txt` y el `noindex` del prerenderizado: el sitio publico
 * es una cosa y la consola es otra.
 */
const RUTAS_INTERNAS = ["/consola", "/login"];

const esRutaInterna = () => {
  const ruta = window.location.pathname;
  return RUTAS_INTERNAS.some((base) => ruta === base || ruta.startsWith(`${base}/`));
};

/**
 * Google marca el clic pago con `gclid`. En iOS, cuando el navegador impide leerlo, manda `wbraid`
 * (trafico web) o `gbraid` (desde una app). Los tres cumplen el mismo papel y se guarda el que
 * venga, porque la importacion de conversiones fuera de linea acepta cualquiera de ellos.
 */
const PARAMETROS_CLIC = ["gclid", "wbraid", "gbraid"];
const PARAMETROS_CAMPANA = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
];

/**
 * Guarda de donde vino esta visita, si vino de un anuncio.
 *
 * POR QUE SE GUARDA Y NO SE LEE EN EL MOMENTO DEL CLIC: el identificador viene en la URL de
 * llegada y se pierde en cuanto la persona navega. Alguien que entra por el anuncio a la guia de
 * sanciones, la lee entera y recien despues abre la conversacion ya no tiene el parametro en la
 * barra de direcciones. Sin esto, el unico caso que quedaria atribuido es el de quien hace clic en
 * el boton en la misma pantalla en la que aterrizo.
 *
 * Solo se escribe cuando hay identificador de clic: una visita organica no deja nada.
 */
function guardarAtribucion() {
  const parametros = new URLSearchParams(window.location.search);
  const clic = PARAMETROS_CLIC.map((p) => [p, parametros.get(p)]).find(([, v]) => v);
  if (!clic) return;

  const atribucion = { tipo: clic[0], valor: clic[1], ts: Date.now() };
  for (const p of PARAMETROS_CAMPANA) {
    const v = parametros.get(p);
    if (v) atribucion[p] = v;
  }

  try {
    window.localStorage.setItem(LLAVE, JSON.stringify(atribucion));
  } catch {
    // Modo privado o almacenamiento lleno. La medicion es accesoria: que falle no puede impedir
    // que la persona abra la conversacion, asi que se sigue sin rastro.
  }
}

/** Lee la atribucion guardada, si sigue vigente. */
export function atribucionGuardada() {
  if (!hayNavegador()) return null;
  try {
    const crudo = window.localStorage.getItem(LLAVE);
    if (!crudo) return null;
    const atribucion = JSON.parse(crudo);
    if (!atribucion?.valor || Date.now() - atribucion.ts > VIGENCIA_MS) {
      window.localStorage.removeItem(LLAVE);
      return null;
    }
    return atribucion;
  } catch {
    return null;
  }
}

/**
 * El rastro que se le pega al mensaje de WhatsApp, o cadena vacia si la visita no vino de un
 * anuncio.
 *
 * ESTO ES LA VERSION 1 Y TIENE UN COSTO VISIBLE: el identificador de Google mide unos noventa
 * caracteres y va en el primer mensaje que la persona envia. Es feo y ademas lo puede borrar antes
 * de mandarlo. Se acepta porque es lo unico que funciona de punta a punta sin tocar el backend, y
 * porque el identificador COMPLETO es un requisito de Google: para importar la conversion cuando
 * alguien pague, hay que subir exactamente el mismo valor que llego en la URL, sin recortar.
 *
 * La version 2 evidente es guardar {codigo corto -> identificador} en el backend al momento del
 * clic y mandar solo el codigo en el mensaje. Cuando exista ese endpoint, lo unico que cambia es
 * esta funcion.
 *
 * Quien llega por busqueda organica no ve nada de esto: sin identificador, el mensaje sale limpio.
 */
export function referenciaDeAnuncio() {
  const atribucion = atribucionGuardada();
  if (!atribucion) return "";
  return `\n\nref: ${atribucion.valor}`;
}

/**
 * Carga la etiqueta de Google y guarda la atribucion de esta visita.
 *
 * Se llama una vez, desde el arranque del cliente. En el servidor no hace nada: el prerenderizado
 * no tiene navegador ni tiene por que medir.
 */
export function iniciarMedicion() {
  if (!hayNavegador() || esRutaInterna()) return;

  // La atribucion se guarda SIEMPRE que haya identificador, incluso sin etiqueta configurada. Son
  // dos cosas separadas: medir en Google es una; saber de que anuncio vino un cliente que pago es
  // otra, y esta segunda funciona sola.
  guardarAtribucion();

  if (!HAY_ETIQUETA || window.gtag) return;

  window.dataLayer = window.dataLayer || [];
  // La forma de `gtag` la fija Google: tiene que empujar el objeto `arguments` tal cual, no un
  // arreglo. Con una funcion flecha y parametros repartidos, la etiqueta no reconoce las llamadas.
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag("js", new Date());
  for (const id of [ID_ADS, ID_GA4].filter(Boolean)) gtag("config", id);

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ID_ADS || ID_GA4)}`;
  document.head.appendChild(script);
}

/**
 * Avisa a Google Ads que alguien abrio la conversacion.
 *
 * NO HAY QUE ESPERAR A QUE LA PETICION SALGA. La pagina no navega a ninguna parte —WhatsApp se
 * abre en otra pestaña— asi que este documento sigue vivo y la peticion se completa sola. El
 * `event_callback` que Google recomienda es para el caso contrario, el del enlace que reemplaza la
 * pagina antes de que el evento alcance a salir.
 *
 * Sin etiqueta configurada no hace nada, que es lo que corresponde: el sitio funciona igual y el
 * boton abre la conversacion lo mismo.
 */
export function registrarAperturaDeChat() {
  if (!hayNavegador() || !window.gtag) return;

  if (ID_ADS && ETIQUETA_CONVERSION) {
    window.gtag("event", "conversion", {
      send_to: `${ID_ADS}/${ETIQUETA_CONVERSION}`,
    });
  }
  // El mismo hecho, con nombre propio, para GA4. Sirve para leer el embudo por fuente de trafico
  // aunque nunca se pague un anuncio.
  if (ID_GA4) window.gtag("event", "abrir_conversacion");
}
