/**
 * La pantalla de ingreso del contador. Ruta `/login`.
 *
 * ═══ POR QUE ES UNA RUTA PROPIA Y NO UN GATE DENTRO DE /consola ═══
 *
 * Porque hay que poder MANDARLA: "entra a declaras.co/login" es una instruccion que se da por
 * WhatsApp. Un gate que solo aparece al tropezarse con la consola no se puede enlazar.
 *
 * Que exista la ruta no la hace visible: la landing no enlaza aca y `robots.txt` la excluye. Y
 * conviene tenerlo claro —lo hablamos— que eso NO es lo que la protege: no aparecer en Google no
 * es un control de acceso. Lo que protege es que sin sesion el backend responde 401 y sin estar en
 * la lista de contadores responde 403.
 *
 * ═══ POR QUE EL ERROR NO DICE CUAL DE LOS DOS ESTUVO MAL ═══
 *
 * "Ese correo no existe" le confirma a quien prueba cuales correos SI existen, y con eso arma la
 * lista de a quien atacar. Se dice lo mismo en los dos casos, que es la practica normal y no una
 * pereza de redaccion.
 */

import { useState } from "react";
import { Navigate, useLocation } from "react-router";

import { hayProyecto, useSesion } from "./sesion";
import "./consola.css";

export default function Entrar() {
  const { sesion, cargando, entrar } = useSesion();
  const ubicacion = useLocation();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // Ya hay sesion: no se muestra el formulario de nuevo. `replace` para que el boton de atras no
  // devuelva a una pantalla de ingreso que ya no aplica.
  if (sesion) {
    const destino = ubicacion.state?.desde ?? "/consola";
    return <Navigate to={destino} replace />;
  }

  if (cargando) return <div className="entrar-cargando">Un momento…</div>;

  async function enviar(evento) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await entrar(correo, clave);
    } catch {
      // El error del proveedor no se muestra: distingue "usuario no existe" de "clave
      // incorrecta", que es justo lo que no se quiere decir.
      setError("El correo o la clave no coinciden.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="entrar">
      <form className="entrar-caja" onSubmit={enviar}>
        <h1 className="entrar-titulo">
          <span className="logo-word">Clara</span>
          <span className="logo-dot">.</span>
        </h1>
        <p className="entrar-nota">Consola del contador</p>

        {!hayProyecto ? (
          // Sin proyecto configurado no se ofrece un formulario que no puede funcionar: escribir
          // la clave y ver un error del SDK es peor que saber que falta configuracion.
          <p className="entrar-error" role="alert">
            El ingreso no está configurado en este despliegue.
          </p>
        ) : (
          <>
            <label className="entrar-campo">
              <span>Correo</span>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                autoComplete="username"
                autoFocus
                required
              />
            </label>

            <label className="entrar-campo">
              <span>Clave</span>
              <input
                type="password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>

            <button className="entrar-boton" type="submit" disabled={enviando}>
              {enviando ? "Entrando…" : "Entrar"}
            </button>

            {/* Ocupa su alto siempre para que la caja no salte cuando aparece el error. */}
            <p className="entrar-error" role="alert">
              {error ?? " "}
            </p>
          </>
        )}
      </form>
    </div>
  );
}
