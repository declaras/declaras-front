/**
 * El primer mensaje de WhatsApp, segun de donde viene la persona.
 *
 * POR QUE IMPORTA: ese mensaje es lo unico que el canal de venta sabe del contexto. "Quiero saber
 * si debo declarar" y "quiero hacer mi declaracion" son dos conversaciones distintas: la primera
 * arranca con las cinco preguntas de los topes y la segunda va directo a pedir la clave. Mandar a
 * todo el mundo con el mismo saludo obligaba al bot a adivinar, y adivinaba mal justo con quien ya
 * venia decidido.
 *
 * Los textos van en primera persona porque los envia la persona, no Clara.
 */
export const MENSAJES = {
  declarar: "Hola, quiero hacer mi declaración de renta con Clara.",
  meToca: "Hola, ya sé que me toca declarar y quiero hacer mi declaración con Clara.",
  averiguar: "Hola Clara, quiero saber si debo declarar renta.",
  experto: "Hola, quiero que un contador revise si me toca declarar renta.",
};
