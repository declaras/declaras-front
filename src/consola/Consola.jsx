/** Cascaron de la consola del contador: navegacion y estado del servicio. */

import { NavLink, Route, Routes } from "react-router-dom";

import { api } from "./api";
import { useApi } from "./hooks";
import DetalleExpediente from "./DetalleExpediente";
import ListaExpedientes from "./ListaExpedientes";
import "./consola.css";

export default function Consola() {
  return (
    <div className="consola">
      <header className="consola-top">
        <NavLink to="/consola" className="logo">
          <span className="logo-word">Clara</span>
          <span className="logo-dot">.</span>
        </NavLink>
        <span className="consola-badge">Consola del contador</span>
        <nav className="consola-nav">
          <NavLink to="/consola" end className={({ isActive }) => (isActive ? "active" : "")}>
            Expedientes
          </NavLink>
          <NavLink to="/">Sitio público</NavLink>
        </nav>
        <EstadoServicio />
      </header>

      <main className="consola-body">
        <Routes>
          <Route index element={<ListaExpedientes />} />
          <Route path="expedientes/:caseId" element={<DetalleExpediente />} />
        </Routes>
      </main>
    </div>
  );
}

/** Indicador del backend: sin el, todo lo demas falla y conviene verlo de una. */
function EstadoServicio() {
  const { data, error } = useApi(() => api.health(), []);
  if (error) {
    return (
      <span className="chip chip-red" title={error.message}>
        <span className="chip-dot" /> servicio caído
      </span>
    );
  }
  if (!data) return null;
  return (
    <span
      className="chip chip-green"
      title={`Conector DIAN en modo ${data.dian_adapter}`}
    >
      <span className="chip-dot" /> {data.dian_adapter}
    </span>
  );
}
