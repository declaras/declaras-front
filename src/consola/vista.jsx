/**
 * Para quien esta escrita la pantalla.
 *
 * El producto es para que una persona resuelva su propia declaracion. El contador ve lo
 * mismo, mas profundidad: los renglones del formulario, los campos que se leyeron de cada
 * documento, los codigos internos. Ese orden importa y no es simetrico: una pantalla pensada
 * para el cliente le sirve al contador, pero una pantalla pensada para el contador no le
 * sirve al cliente, porque le pide vocabulario que no tiene por que tener.
 *
 * Por eso el modo por defecto es el del cliente, y lo del contador es lo que se agrega.
 */

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const CLAVE = "declaras.vista";
const CLAVE_QUIEN = "declaras.quien";

const VistaContext = createContext({
  profunda: false,
  alternar: () => {},
  quien: null,
  identificarse: () => {},
});

/**
 * La vista se puede fijar por la direccion: `?vista=contador` o `?vista=cliente`.
 *
 * Sirve para enlazar directo a una de las dos, que sin esto era imposible: el modo vivia solo en
 * el almacenamiento del navegador, asi que no se podia mandar un enlace ni abrir la vista del
 * contador desde fuera. Lo que venga en la direccion manda y queda guardado, para que el resto
 * de la sesion siga ahi sin repetir el parametro.
 */
function vistaDeLaDireccion() {
  const pedida = new URLSearchParams(globalThis.location?.search ?? "").get("vista");
  return pedida === "contador" ? true : pedida === "cliente" ? false : null;
}

/**
 * `porDefecto` es la vista de quien no ha elegido ninguna.
 *
 * POR QUE NO ES SIEMPRE LA DEL CLIENTE, QUE ERA EL DEFAULT. Cuando esto se escribio no habia
 * login: cualquiera podia llegar a la consola, asi que arrancar en la vista del cliente era lo
 * prudente. Ahora entrar exige una cuenta y esa cuenta esta en la lista de contadores — o sea que
 * a quien llega ya lo conocemos, y sabemos que es contador. Recibirlo con la pantalla del cliente
 * y pedirle que se autodeclare de quien es la declaracion era preguntarle algo que ya sabemos.
 *
 * El orden de precedencia se mantiene: lo que diga la direccion manda, luego lo que la persona
 * eligio antes, y solo al final este default. Un contador que se pasa a la vista del cliente para
 * ver que vera su cliente sigue encontrandola ahi la proxima vez.
 */
export function ProveedorDeVista({ children, porDefecto = false }) {
  const [profunda, setProfunda] = useState(() => {
    const deLaDireccion = vistaDeLaDireccion();
    if (deLaDireccion !== null) return deLaDireccion;
    const guardada = globalThis.localStorage?.getItem(CLAVE);
    if (guardada) return guardada === "contador";
    return porDefecto;
  });
  // De quien es la declaracion que se esta viendo en modo cliente. Mientras no exista ingreso
  // con clave, esto hace las veces de identidad: sin ella la pantalla decia "tus declaraciones"
  // y listaba las de todo el mundo, que es peor que no mostrar nada.
  const [quien, setQuien] = useState(() => globalThis.localStorage?.getItem(CLAVE_QUIEN) ?? null);

  useEffect(() => {
    globalThis.localStorage?.setItem(CLAVE, profunda ? "contador" : "cliente");
  }, [profunda]);

  useEffect(() => {
    if (quien) globalThis.localStorage?.setItem(CLAVE_QUIEN, quien);
    else globalThis.localStorage?.removeItem(CLAVE_QUIEN);
  }, [quien]);

  const alternar = useCallback(() => setProfunda((v) => !v), []);
  const identificarse = useCallback((clienteId) => setQuien(clienteId), []);

  return (
    <VistaContext.Provider value={{ profunda, alternar, quien, identificarse }}>
      {children}
    </VistaContext.Provider>
  );
}

export const useVista = () => useContext(VistaContext);

/** Envuelve lo que solo tiene sentido con vocabulario de contador. */
export function SoloContador({ children }) {
  const { profunda } = useVista();
  return profunda ? children : null;
}
