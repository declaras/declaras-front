/**
 * Que ha pasado con la declaracion.
 *
 * Es el registro que respalda la garantia si la DIAN pregunta, y no se edita ni se borra. Lo
 * que se muestra es el texto del evento, escrito para que lo lea una persona: el codigo
 * interno (`DIAN_QUERY`) sirve para consultar la bitacora por tipo, no para mostrarlo, y verlo
 * en la pantalla solo genera la pregunta "y eso que significa".
 */

import { useState } from "react";

import { formatDateTime } from "./formato";

const VISIBLES_AL_INICIO = 4;

export default function Actividad({ eventos }) {
  const [todos, setTodos] = useState(false);
  if (!eventos?.length) return null;

  const ordenados = [...eventos].reverse();
  const visibles = todos ? ordenados : ordenados.slice(0, VISIBLES_AL_INICIO);

  return (
    <section className="bloque">
      <header className="bloque-top">
        <h2 className="bloque-titulo">Qué ha pasado</h2>
      </header>

      <ol className="actividad">
        {visibles.map((evento) => (
          <li key={evento.id}>
            <span className="actividad-cuando">{formatDateTime(evento.occurred_at)}</span>
            {/* Sin el código del evento: en una columna de 252 píxeles desbordaba, y el sitio
                donde sirve para rastrear es la memoria de cálculo, no el registro de actividad. */}
            <span className="actividad-que">{evento.message}</span>
          </li>
        ))}
      </ol>

      {ordenados.length > VISIBLES_AL_INICIO ? (
        <div className="bloque-pie">
          <button className="enlace-suave" onClick={() => setTodos((v) => !v)}>
            {todos ? "Ver menos" : `Ver todo (${ordenados.length})`}
          </button>
        </div>
      ) : null}
    </section>
  );
}
