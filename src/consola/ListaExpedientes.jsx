/**
 * La entrada.
 *
 * Para el cliente no hay lista de clientes: hay sus declaraciones, una por ano. Para el
 * contador si, y ademas necesita ver muchas de un vistazo, contarlas y saber cuales estan
 * listas. Son dos necesidades distintas sobre los mismos datos, asi que es la misma pantalla
 * con dos densidades y no dos pantallas.
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Users } from "lucide-react";

import { api } from "./api";
import { useAction, useApi } from "./hooks";
import { formatDateTime, statusLabel } from "./formato";
import { Cargando, ChipEstado, ErrorApi, Vacio } from "./componentes";
import { useVista } from "./vista";

// La declaracion de un ano se presenta al ano siguiente, asi que el ano gravable por defecto
// es el anterior al actual.
const ANIO_GRAVABLE_POR_DEFECTO = new Date().getFullYear() - 1;

export default function ListaExpedientes() {
  const { profunda } = useVista();
  const navigate = useNavigate();
  const expedientes = useApi(() => api.listCases(), []);
  const clientes = useApi(() => api.listClients(), []);
  const [empezando, setEmpezando] = useState(false);

  const porId = useMemo(() => {
    const mapa = new Map();
    for (const cliente of clientes.data ?? []) mapa.set(cliente.id, cliente);
    return mapa;
  }, [clientes.data]);

  const recargar = () => {
    expedientes.reload();
    clientes.reload();
  };

  const abrir = (caso) => navigate(`/consola/expedientes/${caso.id}`);
  const casos = expedientes.data ?? [];

  if (!profunda) {
    return (
      <section>
        <h1 className="lista-titulo">Tus declaraciones</h1>
        <p className="lista-sub">
          Una por año gravable. Abre la del año que quieras revisar o presentar.
        </p>

        <ErrorApi error={expedientes.error} />
        {expedientes.loading ? <Cargando filas={3} /> : null}

        <div className="tarjetas">
          {casos.map((caso) => (
            <button key={caso.id} className="tarjeta" onClick={() => abrir(caso)}>
              <span className="tarjeta-anio">{caso.tax_year}</span>
              <span className="tarjeta-estado">{statusLabel(caso.status)}</span>
              <ArrowRight size={16} className="tarjeta-flecha" />
            </button>
          ))}
        </div>

        {empezando ? (
          <FormularioNuevo
            simple
            onListo={(caso) => {
              setEmpezando(false);
              recargar();
              abrir(caso);
            }}
            onCancelar={() => setEmpezando(false)}
          />
        ) : (
          <button className="btn-grande" onClick={() => setEmpezando(true)}>
            {casos.length ? "Empezar otro año" : "Empezar mi declaración"}
          </button>
        )}
      </section>
    );
  }

  return (
    <div className="lista-clientes">
      <h1 className="lista-titulo">Clientes</h1>
      <p className="lista-sub">Cada declaración es el trabajo de un cliente para un año gravable.</p>

      <ErrorApi error={expedientes.error} />

      <div className="metricas">
        <Metrica valor={casos.length || "—"} nombre="Declaraciones" />
        <Metrica valor={clientes.data?.length ?? "—"} nombre="Clientes" />
        <Metrica
          valor={casos.filter((c) => c.status === "READY_FOR_REVIEW").length}
          nombre="Listas para revisar"
        />
        <Metrica valor={casos.filter((c) => c.status === "SUBMITTED").length} nombre="Presentadas" />
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Todas las declaraciones</h2>
          {casos.length ? <span className="count">{casos.length}</span> : null}
          <span className="spacer" />
          <button className="btn-mini primario" onClick={() => setEmpezando((v) => !v)}>
            Nueva declaración
          </button>
        </div>

        {empezando ? (
          <FormularioNuevo
            onListo={(caso) => {
              setEmpezando(false);
              recargar();
              abrir(caso);
            }}
            onCancelar={() => setEmpezando(false)}
          />
        ) : null}

        {expedientes.loading ? <Cargando filas={4} /> : null}

        {!expedientes.loading && casos.length === 0 ? (
          <Vacio>Todavía no hay declaraciones. Abre la primera para empezar.</Vacio>
        ) : null}

        {casos.length > 0 ? (
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
              {casos.map((caso) => {
                const cliente = porId.get(caso.client_id);
                return (
                  <tr key={caso.id} className="clickable" onClick={() => abrir(caso)}>
                    <td className="strong">
                      {cliente?.full_name ?? "Sin nombre"}
                      <div className="celda-suave" style={{ fontWeight: 400, fontSize: 12.5 }}>
                        {cliente ? `${cliente.id_kind} ${cliente.id_number}` : caso.client_id}
                      </div>
                    </td>
                    <td className="num strong">{caso.tax_year}</td>
                    <td>
                      <ChipEstado status={caso.status} />
                    </td>
                    <td className="celda-suave">{formatDateTime(caso.updated_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : null}
      </div>

      <ListaClientes clientes={clientes} />
    </div>
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

/**
 * Abrir una declaracion.
 *
 * En modo simple solo se pide la cedula y el ano: es el minimo para consultar la DIAN, y el
 * nombre lo trae el RUT. Pedirle a alguien datos que el sistema va a averiguar en el siguiente
 * paso es la clase de friccion que hace que se abandone un formulario.
 */
function FormularioNuevo({ onListo, onCancelar, simple = false }) {
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
    <form className={simple ? "clave-forma" : "panel-body"} onSubmit={enviar}>
      <ErrorApi error={accion.error} />
      <div className={simple ? "" : "fila-campos"}>
        <label className="campo">
          <span>{simple ? "Tu cédula" : "Cédula del cliente"}</span>
          <input
            value={datos.id_number}
            onChange={cambiar("id_number")}
            placeholder="1020304050"
            inputMode="numeric"
            required
            minLength={5}
            autoFocus
          />
        </label>
        <label className="campo">
          <span>Año gravable</span>
          <input value={datos.tax_year} onChange={cambiar("tax_year")} inputMode="numeric" required />
        </label>
        {simple ? null : (
          <>
            <label className="campo">
              <span>Nombre completo</span>
              <input
                value={datos.full_name}
                onChange={cambiar("full_name")}
                placeholder="Ana María Pérez"
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
          </>
        )}
      </div>
      <div className="clave-botones">
        <button className={simple ? "btn-grande" : "btn-mini primario"} disabled={accion.running}>
          {accion.running ? "Abriendo…" : simple ? "Continuar" : "Abrir declaración"}
        </button>
        <button type="button" className="enlace-suave" onClick={onCancelar}>
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
              <td className="celda-suave">{cliente.phone_number ?? "—"}</td>
              <td className="celda-suave">{cliente.email ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
