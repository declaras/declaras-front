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
  // LOS DOS QUE PARTEN EL PRECIO. Quien no puede entrar al portal no tiene camino gratis: para
  // esa persona hay un tramite de verdad (sacar el RUT, habilitar la cuenta, recuperar la clave)
  // y es lo que se cobra. El texto lo dice para que la conversacion arranque sabiendolo, sin
  // tener que averiguarlo preguntando.
  //
  // "No se mi clave" y no "no tengo cuenta", a proposito: tener RUT, tener la cuenta activa en
  // Muisca y acordarse de la clave son tres cosas distintas, y mucha gente tiene RUT de algun
  // trabajo sin haber entrado nunca. Lo que la persona SI puede juzgar es si puede entrar, y en
  // los tres casos el tramite que hay que hacer es el mismo.
  sinClave: "Hola, quiero saber si me toca declarar renta. No sé mi clave de la DIAN.",
  conClave: "Hola, quiero saber si me toca declarar renta. Tengo mi clave de la DIAN.",
};
