/**
 * Cascaron de la aplicacion.
 *
 * El interruptor de vista es lo unico que distingue al contador del cliente. No hay dos
 * aplicaciones ni dos juegos de pantallas: hay una, escrita para el cliente, y un modo que
 * agrega profundidad. Mantenerlo asi es lo que evita que la version del cliente se quede atras
 * cada vez que se le agrega algo a la del contador.
 */

import { NavLink, Route, Routes } from "react-router";

import { api } from "./api";
import { useApi } from "./hooks";
import DetalleExpediente from "./DetalleExpediente";
import ListaExpedientes from "./ListaExpedientes";
import { ProveedorDeVista, useVista } from "./vista";
import "./consola.css";

export default function Consola() {
  return (
    <ProveedorDeVista>
      <div className="app">
        <Cabecera />
        <main className="app-cuerpo">
          <Routes>
            <Route index element={<ListaExpedientes />} />
            <Route path="expedientes/:caseId" element={<DetalleExpediente />} />
          </Routes>
        </main>
      </div>
    </ProveedorDeVista>
  );
}

function Cabecera() {
  const { profunda, alternar } = useVista();
  return (
    <header className="app-top">
      <NavLink to="/consola" className="logo">
        <span className="logo-word">Clara</span>
        <span className="logo-dot">.</span>
      </NavLink>

      <div className="app-top-derecha">
        <EstadoServicio />
        <button
          className={`interruptor ${profunda ? "interruptor-activo" : ""}`}
          onClick={alternar}
          aria-pressed={profunda}
          title="Muestra los renglones del formulario, los campos leídos y los códigos internos"
        >
          Vista de contador
        </button>
      </div>
    </header>
  );
}

/** Sin backend nada funciona, y conviene verlo antes de intentar algo. */
function EstadoServicio() {
  const { data, error } = useApi(() => api.health(), []);
  if (error) {
    return (
      <span className="servicio servicio-caido" title={error.message}>
        <span className="servicio-punto" /> sin conexión
      </span>
    );
  }
  if (!data) return null;
  return (
    <span className="servicio" title={`Conector DIAN en modo ${data.dian_adapter}`}>
      <span className="servicio-punto" />
      {data.dian_adapter === "fake" ? "modo de prueba" : "conectado a la DIAN"}
    </span>
  );
}
