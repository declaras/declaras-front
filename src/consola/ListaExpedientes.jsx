/** Lista de expedientes: la pantalla de entrada del contador. */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderPlus, Users } from "lucide-react";

import { api } from "./api";
import { useAction, useApi } from "./hooks";
import { formatDateTime } from "./formato";
import { Cargando, ChipEstado, ErrorApi, Vacio } from "./componentes";

const ANIO_GRAVABLE_POR_DEFECTO = new Date().getFullYear() - 1;

export default function ListaExpedientes() {
  const navigate = useNavigate();
  const expedientes = useApi(() => api.listCases(), []);
  const clientes = useApi(() => api.listClients(), []);
  const [abriendo, setAbriendo] = useState(false);

  // El expediente guarda el id del cliente, no su nombre: se cruza aqui para que la
  // tabla muestre a quien pertenece cada caso.
  const porId = useMemo(() => {
    const mapa = new Map();
    for (const cliente of clientes.data ?? []) mapa.set(cliente.id, cliente);
    return mapa;
  }, [clientes.data]);

  const recargar = () => {
    expedientes.reload();
    clientes.reload();
  };

  return (
    <>
      <h1 className="consola-h1">Expedientes</h1>
      <p className="consola-sub">
        Cada expediente es el trabajo de un cliente para un año gravable.
      </p>

      <ErrorApi error={expedientes.error} />

      <div className="metricas">
        <Metrica valor={expedientes.data?.length ?? "—"} nombre="Expedientes" />
        <Metrica valor={clientes.data?.length ?? "—"} nombre="Clientes" />
        <Metrica
          valor={(expedientes.data ?? []).filter((c) => c.status === "READY_FOR_REVIEW").length}
          nombre="Listos para revisar"
        />
        <Metrica
          valor={(expedientes.data ?? []).filter((c) => c.status === "SUBMITTED").length}
          nombre="Presentados"
        />
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Todos los expedientes</h2>
          {expedientes.data ? <span className="count">{expedientes.data.length}</span> : null}
          <span className="spacer" />
          <button className="btn-mini primario" onClick={() => setAbriendo((v) => !v)}>
            <FolderPlus size={13} />
            Abrir expediente
          </button>
        </div>

        {abriendo ? (
          <FormularioNuevo
            onListo={(caso) => {
              setAbriendo(false);
              recargar();
              navigate(`/consola/expedientes/${caso.id}`);
            }}
            onCancelar={() => setAbriendo(false)}
          />
        ) : null}

        {expedientes.loading ? <Cargando filas={4} /> : null}

        {!expedientes.loading && (expedientes.data ?? []).length === 0 ? (
          <Vacio>
            Todavía no hay expedientes. Abre el primero para empezar a trabajar un cliente.
          </Vacio>
        ) : null}

        {(expedientes.data ?? []).length > 0 ? (
          <table className="tabla">
            <thead>
              <tr>
                <th>Cliente</th>
                <th className="num">Año gravable</th>
                <th>Estado</th>
                <th>Última actividad</th>
              </tr>
            </thead>
            <tbody>
              {expedientes.data.map((caso) => {
                const cliente = porId.get(caso.client_id);
                return (
                  <tr
                    key={caso.id}
                    className="clickable"
                    onClick={() => navigate(`/consola/expedientes/${caso.id}`)}
                  >
                    <td className="strong">
                      {cliente?.full_name ?? "Sin nombre"}
                      <div style={{ color: "var(--muted)", fontSize: 12.5, fontWeight: 400 }}>
                        {cliente ? `${cliente.id_kind} ${cliente.id_number}` : caso.client_id}
                      </div>
                    </td>
                    <td className="num strong">{caso.tax_year}</td>
                    <td>
                      <ChipEstado status={caso.status} />
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: 13 }}>
                      {formatDateTime(caso.updated_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : null}
      </div>

      <ListaClientes clientes={clientes} />
    </>
  );
}

function Metrica({ valor, nombre }) {
  return (
    <div className="metrica">
      <div className="metrica-valor">{valor}</div>
      <div className="metrica-nombre">{nombre}</div>
    </div>
  );
}

function FormularioNuevo({ onListo, onCancelar }) {
  const [datos, setDatos] = useState({
    id_number: "",
    full_name: "",
    tax_year: ANIO_GRAVABLE_POR_DEFECTO,
    phone_number: "",
  });
  const accion = useAction((payload) => api.openCase(payload));

  const cambiar = (campo) => (evento) =>
    setDatos((previo) => ({ ...previo, [campo]: evento.target.value }));

  const enviar = async (evento) => {
    evento.preventDefault();
    const caso = await accion.run({
      id_number: datos.id_number.trim(),
      full_name: datos.full_name.trim() || null,
      phone_number: datos.phone_number.trim() || null,
      tax_year: Number(datos.tax_year),
    });
    if (caso) onListo(caso);
  };

  return (
    <form className="panel-body" onSubmit={enviar} style={{ borderBottom: "1px solid var(--line)" }}>
      <ErrorApi error={accion.error} />
      <div className="fila-campos">
        <label className="campo">
          <span>Cédula del cliente</span>
          <input
            value={datos.id_number}
            onChange={cambiar("id_number")}
            placeholder="1020304050"
            inputMode="numeric"
            required
            minLength={5}
          />
        </label>
        <label className="campo">
          <span>Nombre completo</span>
          <input
            value={datos.full_name}
            onChange={cambiar("full_name")}
            placeholder="Ana María Pérez"
          />
        </label>
        <label className="campo">
          <span>Año gravable</span>
          <input
            value={datos.tax_year}
            onChange={cambiar("tax_year")}
            inputMode="numeric"
            required
          />
        </label>
        <label className="campo">
          <span>WhatsApp (opcional)</span>
          <input
            value={datos.phone_number}
            onChange={cambiar("phone_number")}
            placeholder="+57 300 000 0000"
          />
        </label>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn-mini primario" disabled={accion.running}>
          {accion.running ? "Abriendo…" : "Abrir expediente"}
        </button>
        <button type="button" className="btn-mini" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function ListaClientes({ clientes }) {
  if (clientes.loading || (clientes.data ?? []).length === 0) return null;
  return (
    <div className="panel">
      <div className="panel-head">
        <Users size={15} style={{ color: "var(--muted)" }} />
        <h2>Clientes</h2>
        <span className="count">{clientes.data.length}</span>
      </div>
      <table className="tabla">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Documento</th>
            <th>WhatsApp</th>
            <th>Correo</th>
          </tr>
        </thead>
        <tbody>
          {clientes.data.map((cliente) => (
            <tr key={cliente.id}>
              <td className="strong">{cliente.full_name ?? "Sin nombre"}</td>
              <td className="num">
                {cliente.id_kind} {cliente.id_number}
              </td>
              <td style={{ color: "var(--muted)" }}>{cliente.phone_number ?? "—"}</td>
              <td style={{ color: "var(--muted)" }}>{cliente.email ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
