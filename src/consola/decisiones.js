/**
 * Como se llama cada decision del cruce cuando hay que mostrarla.
 *
 * EL PAR LO DA EL BACKEND, NO ESTA TABLA. Sobre una fila ajena, `decisiones_posibles` ofrece
 * `USAR_DIAN` (aceptar la cifra reportada, o sea "sí es mío") y `MARCAR_AJENO` ("no es mío"); las
 * otras dos que ofrece son tecnicas. Aca solo se traduce la clave a una frase.
 *
 * VIVE APARTE porque lo usan dos pantallas: la tarjeta con la que se decide (`EtapaDecisiones`) y
 * el registro de lo ya contestado (`YaContestado`). Estaban duplicadas en las dos, que es la forma
 * de que un dia digan cosas distintas para la misma decision.
 *
 * PENDIENTE, ANOTADO A PROPOSITO: esto deberia venir del backend, como `en_palabras` para los pasos
 * del calculo y los renglones del 210. Si alguien agrega un valor al enum `Decision`, hoy el front
 * lo muestra en crudo ("CERRAR_SIN_SOPORTE") y nada avisa — el mismo modo de falla silencioso que
 * `parametros/en_palabras.py` cerro para las otras dos. No se movio aqui porque `decisiones_posibles`
 * viaja por partida y meterle los nombres lo repetiria en cada fila; hace falta decidir donde.
 */

/**
 * Cuando la pregunta es de pertenencia: sí o no, en primera persona.
 *
 * Se usa sobre una fila que un tercero reportó a nombre de OTRA persona. Ahí lo único que hay que
 * saber es si esa plata es del titular, y quien contesta es él.
 */
export const COMO_TITULAR_PERTENENCIA = {
  USAR_DIAN: "Sí, es mío",
  MARCAR_AJENO: "No, no es mío",
};

/**
 * Cuando la decisión ya se tomó y hay que contarle al titular en qué quedó.
 *
 * Están las SEIS, no solo las dos que él puede contestar, y eso es el arreglo: antes las técnicas
 * caían a la tabla del contador y al cliente le salía "Cerrar sin documento" en su propio registro
 * de lo que había respondido. Un fallback a lenguaje técnico es el mismo modo de falla silencioso
 * que `en_palabras.py` cerró en el backend, solo que aquí no hay test que lo atrape: si se agrega
 * un valor al enum `Decision`, tiene que agregarse en las dos tablas.
 *
 * Van en voz de "qué pasó" porque varias las tomó el contador, no él.
 */
export const COMO_TITULAR_ESTADO = {
  CLASIFICAR: "Se ubicó en su cédula",
  USAR_DIAN: "Se aceptó lo que reportaron",
  USAR_DOCUMENTO: "Se usó la cifra de tu documento",
  USAR_OTRO: "Se corrigió la cifra",
  MARCAR_AJENO: "No es tuyo",
  CERRAR_SIN_SOPORTE: "Se aceptó sin documento de respaldo",
  LLEVAR_A_MANO: "Lo revisa un contador aparte",
};

/** Cuando quien decide es el contador y la pregunta es cuál cifra rige. */
export const COMO_CONTADOR = {
  CLASIFICAR: "Decir a qué cédula va",
  USAR_DIAN: "Usar la de la DIAN",
  USAR_DOCUMENTO: "Usar la del documento",
  USAR_OTRO: "Poner otra cifra",
  MARCAR_AJENO: "No es del cliente",
  CERRAR_SIN_SOPORTE: "Cerrar sin documento",
  // "Llevarlo a mano" no decia NADA. Nombraba el gesto (sacarlo del sistema) y callaba las dos
  // cosas que hay que saber para elegirlo: que el ingreso NO entra al calculo de Clara, y que
  // entonces le toca a una persona ponerlo en el formulario. Quien lo leia no sabia si estaba
  // descartando la plata o encargandosela a alguien.
  LLEVAR_A_MANO: "Lo pongo yo en el 210",
};

/**
 * Que hace cada decision, cuando el nombre no alcanza.
 *
 * Solo las que tienen consecuencia no obvia. Una linea debajo del boton vale mas que un nombre
 * mas largo: el nombre se lee al escanear y esto se lee al dudar.
 */
export const QUE_HACE = {
  MARCAR_AJENO: "El ingreso no entra a la declaración. Queda constancia de a quién se reportó.",
  CERRAR_SIN_SOPORTE: "Se acepta la cifra de la DIAN sin certificado que la respalde.",
  LLEVAR_A_MANO:
    "Clara no liquida esta cédula todavía. El ingreso queda por fuera del cálculo y lo digitas tú en el formulario.",
  USAR_OTRO: "Rige una cifra que no es ninguna de las dos.",
};

/**
 * El motivo, escrito. Antes se volcaba el enum en minusculas y en pantalla salia "no es mio":
 * el sistema hablando en primera persona sobre la plata de OTRO, en la vista del contador.
 *
 * VIVE ACA Y NO EN LA MESA porque las dos pantallas que ofrecen motivos son la mesa y la tarjeta
 * de correccion. Estaban en una sola de las dos, asi que la otra mostraba el enum crudo.
 */
export const MOTIVO = {
  COINCIDEN: "Las dos cifras coinciden",
  ERROR_DEL_TERCERO: "El tercero reportó mal",
  ERROR_DEL_CERTIFICADO: "El certificado está mal",
  NO_ES_MIO: "No es del cliente",
  FALTA_DOCUMENTO: "Falta el documento",
  DECISION_DEL_CONTADOR: "Criterio del contador",
  FUERA_DEL_MOTOR: "Fuera del alcance del cálculo",
  SIN_CONTRAPARTE_DIAN: "La DIAN no reporta nada que comparar",
  SIN_COSTOS_NI_EMPLEADOS: "Sin costos imputados ni dos o más trabajadores",
  NATURALEZA_DEL_INGRESO: "Por la naturaleza del ingreso",
};

export const nombreDeMotivo = (motivo) => MOTIVO[motivo] ?? motivo;

/**
 * La pregunta que encabeza un renglon, segun quien mira y que hay que resolver.
 *
 * EN LA VISTA DEL CONTADOR NO SE HABLA EN SEGUNDA PERSONA. Decia "¿Reconoces este ingreso?" y
 * "¿Este dinero es tuyo?" a alguien que esta revisando la plata de un tercero: el contador no
 * reconoce nada, pregunta. Era la voz del titular filtrandose a la pantalla equivocada.
 */
export const preguntaDelRenglon = ({ porClasificar, ajena, hayDocumento, profunda }) => {
  if (porClasificar) {
    return profunda ? "¿A qué cédula del 210 va este ingreso?" : "¿Qué fue este pago?";
  }
  if (ajena) return profunda ? "¿Este ingreso es del cliente?" : "¿Este dinero es tuyo?";
  if (hayDocumento) return profunda ? "¿Cuál cifra rige?" : "¿Cuál cifra es la correcta?";
  return profunda ? "¿El cliente reconoce este ingreso?" : "¿Reconoces este ingreso?";
};

/**
 * Las clases de ingreso, dichas para cada quien.
 *
 * LA CLASE CAMBIA EL IMPUESTO y no es una etiqueta: rentas de trabajo da acceso al 25% exento del
 * art. 206 num. 10, rentas de capital no. Por eso al titular no se le pregunta "¿a qué cedula va?"
 * (no puede saberlo) sino el HECHO del que depende, y el sistema deriva la clase.
 */
export const CLASES_DE_INGRESO = {
  RENTA_DE_TRABAJO: {
    titular: "Un trabajo o servicio que hiciste",
    contador: "Rentas de trabajo (art. 336 num. 2)",
    nota: "Aplica si no restas costos y no tuviste dos o más empleados.",
  },
  RENDIMIENTO: {
    titular: "Intereses o rendimientos de una inversión",
    contador: "Rentas de capital, rendimientos",
    nota: null,
  },
  ARRIENDO: {
    titular: "El arriendo de algo tuyo",
    contador: "Rentas de capital, arrendamiento",
    nota: null,
  },
};

/** Qué se está afirmando al elegir. El motivo es el hecho, no una nota. */
export const HECHOS_DE_CLASIFICACION = {
  SIN_COSTOS_NI_EMPLEADOS: {
    titular: "No resté costos y no tuve dos o más empleados",
    contador: "Sin costos imputados ni dos o más trabajadores",
  },
  NATURALEZA_DEL_INGRESO: {
    titular: "En realidad fue otra cosa",
    contador: "Por la naturaleza del ingreso",
  },
};

export const nombreDeClase = (clase, profunda) =>
  (profunda ? CLASES_DE_INGRESO[clase]?.contador : CLASES_DE_INGRESO[clase]?.titular) ?? clase;

/**
 * El mismo nombre para meterlo DENTRO de una frase.
 *
 * Los nombres estan escritos para ir solos, en un desplegable, asi que arrancan en mayuscula.
 * Interpolados quedaba "entra como Un trabajo o servicio que hiciste". La del contador no se toca:
 * "Rentas de trabajo (art. 336 num. 2)" es un nombre propio del formulario.
 */
export const claseEnFrase = (clase, profunda) => {
  const nombre = nombreDeClase(clase, profunda);
  return profunda ? nombre : nombre.charAt(0).toLowerCase() + nombre.slice(1);
};

/**
 * El nombre de una decision para quien la mira.
 *
 * `profunda` manda el vocabulario (quien mira) y `ajena` manda la voz (que se pregunta): sobre una
 * fila que un tercero reporto a nombre de otra persona, la pregunta es de pertenencia y se dice en
 * primera persona; sobre cualquier otra, se cuenta en que quedo.
 *
 * ARREGLA UN BUG DE PASO: antes el discriminador era solo `ajena`, asi que en vista de CONTADOR una
 * fila ajena decia "Si, es mio" — el contador leyendo en primera persona sobre la plata de otro.
 */
export const nombreDeDecision = (decision, { ajena, profunda } = {}) => {
  if (profunda) return COMO_CONTADOR[decision] ?? decision;
  const tabla = ajena ? COMO_TITULAR_PERTENENCIA : COMO_TITULAR_ESTADO;
  return tabla[decision] ?? COMO_TITULAR_ESTADO[decision] ?? decision;
};
