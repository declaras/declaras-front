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

export function ProveedorDeVista({ children }) {
  const [profunda, setProfunda] = useState(
    () => globalThis.localStorage?.getItem(CLAVE) === "contador",
  );
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
