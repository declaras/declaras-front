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
const VistaContext = createContext({ profunda: false, alternar: () => {} });

export function ProveedorDeVista({ children }) {
  const [profunda, setProfunda] = useState(
    () => globalThis.localStorage?.getItem(CLAVE) === "contador",
  );

  useEffect(() => {
    globalThis.localStorage?.setItem(CLAVE, profunda ? "contador" : "cliente");
  }, [profunda]);

  const alternar = useCallback(() => setProfunda((v) => !v), []);
  return (
    <VistaContext.Provider value={{ profunda, alternar }}>{children}</VistaContext.Provider>
  );
}

export const useVista = () => useContext(VistaContext);

/** Envuelve lo que solo tiene sentido con vocabulario de contador. */
export function SoloContador({ children }) {
  const { profunda } = useVista();
  return profunda ? children : null;
}
