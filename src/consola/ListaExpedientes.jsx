/**
 * La entrada.
 *
 * Para el cliente no hay lista de clientes: hay sus declaraciones, una por ano.
 *
 * Para el contador la unidad de trabajo es la PERSONA, no el par (persona, ano): cuando piensa
 * "como va Juan Jose" no piensa "como va Juan Jose 2025". Por eso la lista es de clientes y los
 * anos van adentro. Antes era una tabla de declaraciones con el nombre repetido en cada fila,
 * mas una tabla de clientes debajo con los mismos nombres otra vez: con cuarenta clientes y dos
 * anos eran ciento veinte apariciones del mismo dato, y el nombre dejaba de ser la clave para
 * volverse ruido.
 *
 * En temporada el contador si trabaja un ano a la vez para todos, pero eso es un filtro y no
 * otra estructura.
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { api } from "./api";
import { useAction, useApi } from "./hooks";
import { formatDateTime, statusLabel } from "./formato";
import { Avatar, Cargando, ErrorApi, Vacio } from "./componentes";
import { useVista } from "./vista";

// La declaracion de un ano se presenta al ano siguiente, asi que el ano gravable por defecto es
// el anterior al actual.
const ANIO_GRAVABLE_POR_DEFECTO = new Date().getFullYear() - 1;

// El avance se dice con la palabra y su tono, no con una etiqueta de color: el color se reserva
// para lo que pide atencion, que es lo que esta listo para revisar.
const TONO_AVANCE = {
  OPEN: "avance-quieto",
  EXTRACTING: "avance-andando",
  READY_FOR_REVIEW: "avance-listo",
  DRAFT_READY: "avance-listo",
  SUBMITTED: "avance-cerrado",
  CLOSED: "avance-cerrado",
};

export default function ListaExpedientes() {
  const { profunda } = useVista();
  const navigate = useNavigate();
  const expedientes = useApi(() => api.listCases(), []);
  const clientes = useApi(() => api.listClients(), []);
  const [empezando, setEmpezando] = useState(false);
  const [anioFiltrado, setAnioFiltrado] = useState(null);

  const casos = useMemo(() => expedientes.data ?? [], [expedientes.data]);
  const anios = useMemo(
    () => [...new Set(casos.map((c) => c.tax_year))].sort((a, b) => b - a),
    [casos],
  );

  const porCliente = useMemo(() => {
    const visibles = anioFiltrado ? casos.filter((c) => c.tax_year === anioFiltrado) : casos;
    const grupos = new Map();
    for (const cliente of clientes.data ?? []) grupos.set(cliente.id, { cliente, casos: [] });
    for (const caso of visibles) {
      const grupo = grupos.get(caso.client_id);
      if (grupo) grupo.casos.push(caso);
    }
    return [...grupos.values()]
      .filter((g) => g.casos.length)
      .map((g) => ({ ...g, casos: [...g.casos].sort((a, b) => b.tax_year - a.tax_year) }));
  }, [casos, clientes.data, anioFiltrado]);

  const recargar = () => {
    expedientes.reload();
    clientes.reload();
  };
  const abrir = (caso) => navigate(`/consola/expedientes/${caso.id}`);

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
          {[...casos]
            .sort((a, b) => b.tax_year - a.tax_year)
            .map((caso) => (
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

  const listas = casos.filter((c) => c.status === "READY_FOR_REVIEW").length;

  return (
    <div className="lista-clientes">
      <header className="lista-top">
        <div>
          <h1 className="lista-titulo">Clientes</h1>
          {/* Una linea en vez de cuatro tarjetas de metricas: dos de ellas solo contaban las
              filas que estan justo debajo. */}
          <p className="lista-sub">
            {resumen(casos.length, clientes.data?.length ?? 0, listas)}
          </p>
        </div>
        <button className="btn-mini primario" onClick={() => setEmpezando((v) => !v)}>
          Nueva declaración
        </button>
      </header>

      <ErrorApi error={expedientes.error} />

      {empezando ? (
        <div className="panel" style={{ marginBottom: 24 }}>
          <FormularioNuevo
            onListo={(caso) => {
              setEmpezando(false);
              recargar();
              abrir(caso);
            }}
            onCancelar={() => setEmpezando(false)}
          />
        </div>
      ) : null}

      {/* En temporada se trabaja un ano a la vez para todos: eso es un filtro, no otra pantalla. */}
      {anios.length > 1 ? (
        <div className="filtro-anios">
          <button
            className={anioFiltrado === null ? "filtro-activo" : ""}
            onClick={() => setAnioFiltrado(null)}
          >
            Todos
          </button>
          {anios.map((anio) => (
            <button
              key={anio}
              className={anioFiltrado === anio ? "filtro-activo" : ""}
              onClick={() => setAnioFiltrado(anio)}
            >
              {anio}
            </button>
          ))}
        </div>
      ) : null}

      {expedientes.loading ? <Cargando filas={4} /> : null}
      {!expedientes.loading && porCliente.length === 0 ? (
        <Vacio>Todavía no hay declaraciones. Abre la primera para empezar.</Vacio>
      ) : null}

      <ul className="clientes">
        {porCliente.map(({ cliente, casos: suyos }) => (
          <li className="cliente" key={cliente.id}>
            <div className="cliente-quien">
              <Avatar nombre={cliente.full_name ?? cliente.id_number} size="sm" />
              <div style={{ minWidth: 0 }}>
                <p className="cliente-nombre">{cliente.full_name ?? "Sin nombre"}</p>
                <p className="cliente-doc">
                  {cliente.id_kind} {cliente.id_number}
                  {cliente.phone_number ? ` · ${cliente.phone_number}` : ""}
                  {cliente.email ? ` · ${cliente.email}` : ""}
                </p>
              </div>
            </div>

            <ul className="cliente-anios">
              {suyos.map((caso) => (
                <li key={caso.id}>
                  <button onClick={() => abrir(caso)}>
                    <span className="anio">{caso.tax_year}</span>
                    <span className={`avance ${TONO_AVANCE[caso.status] ?? "avance-quieto"}`}>
                      {statusLabel(caso.status)}
                    </span>
                    <span className="cuando">{formatDateTime(caso.updated_at)}</span>
                    <ArrowRight size={15} className="flecha" />
                  </button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

const resumen = (declaraciones, clientes, listas) => {
  const partes = [
    `${declaraciones} ${declaraciones === 1 ? "declaración" : "declaraciones"}`,
    `${clientes} ${clientes === 1 ? "cliente" : "clientes"}`,
  ];
  const frase = `${partes[0]} de ${partes[1]}`;
  return listas ? `${frase} · ${listas} ${listas === 1 ? "lista" : "listas"} para revisar` : frase;
};

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
