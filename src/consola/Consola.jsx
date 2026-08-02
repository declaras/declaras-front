/**
 * Cascaron de la aplicacion.
 *
 * El interruptor de vista es lo unico que distingue al contador del cliente. No hay dos
 * aplicaciones ni dos juegos de pantallas: hay una, escrita para el cliente, y un modo que
 * agrega profundidad. Mantenerlo asi es lo que evita que la version del cliente se quede atras
 * cada vez que se le agrega algo a la del contador.
 */

import { NavLink, Navigate, Route, Routes, useLocation } from "react-router";

import { api } from "./api";
import { useApi } from "./hooks";
import DetalleExpediente from "./DetalleExpediente";
import ListaExpedientes from "./ListaExpedientes";
import { ProveedorDeSesion, hayProyecto, useSesion } from "./sesion";
import { ProveedorDeVista, useVista } from "./vista";
import "./consola.css";

export default function Consola() {
  return (
    <ProveedorDeSesion>
      <Protegida>
        {/*
          Con sesion se arranca en la vista del contador: entrar exige una cuenta que esta en la
          lista de contadores, asi que a quien llega ya lo conocemos. Sin sesion —el despliegue que
          todavia no tiene Supabase configurado— se mantiene el default viejo.
        */}
        <VistaSegunLaSesion>
          <div className="app">
            <Cabecera />
            <main className="app-cuerpo">
              <Routes>
                <Route index element={<ListaExpedientes />} />
                <Route path="expedientes/:caseId" element={<DetalleExpediente />} />
              </Routes>
            </main>
          </div>
        </VistaSegunLaSesion>
      </Protegida>
    </ProveedorDeSesion>
  );
}

/** El proveedor de vista, con el default puesto segun si hay alguien identificado. */
function VistaSegunLaSesion({ children }) {
  const { sesion } = useSesion();
  return <ProveedorDeVista porDefecto={Boolean(sesion)}>{children}</ProveedorDeVista>;
}

/**
 * Sin sesion no se pinta la consola: se manda a `/login`.
 *
 * ES COMODIDAD, NO SEGURIDAD, y la distincion importa. Un guard de React solo decide que se dibuja;
 * quien quiera los datos no dibuja nada, le habla a la API. Lo que de verdad protege es que el
 * backend responde 401 sin token y 403 si el correo no esta en la lista de contadores.
 *
 * Lo que este guard evita es lo otro: que alguien sin sesion vea una consola vacia llena de errores
 * en vez de una pantalla que le dice que entre.
 *
 * MIENTRAS NO HAY PROYECTO configurado no redirige. En ese despliegue la unica puerta es la clave
 * compartida del middleware, y mandar a `/login` dejaria a la consola inalcanzable — un formulario
 * que no puede funcionar delante de la herramienta que si.
 */
function Protegida({ children }) {
  const { sesion, cargando } = useSesion();
  const ubicacion = useLocation();

  if (!hayProyecto) return children;
  if (cargando) return <div className="entrar-cargando">Un momento…</div>;
  if (!sesion) {
    // Se recuerda a donde iba para volver ahi despues de entrar: perder el destino obliga a
    // navegar de nuevo desde la lista, y con un enlace a un expediente concreto es peor.
    return <Navigate to="/login" state={{ desde: ubicacion.pathname }} replace />;
  }
  return children;
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
        <Salir />
      </div>
    </header>
  );
}

/**
 * Cerrar sesion.
 *
 * No aparece cuando no hay proyecto configurado: en ese despliegue no hay sesion que cerrar, y un
 * boton que no hace nada es peor que no tenerlo. Muestra el correo porque con varias cuentas —la
 * de prueba y la de verdad— saber con cual estas entrado ahorra el rato de no entender por que un
 * expediente no aparece.
 */
function Salir() {
  const { sesion, salir } = useSesion();
  if (!sesion) return null;
  return (
    <button className="salir" onClick={salir} title={sesion.user?.email ?? "Cerrar sesión"}>
      Salir
    </button>
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
