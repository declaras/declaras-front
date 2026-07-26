/**
 * En que va la consulta a la DIAN, mientras corre.
 *
 * POR QUE EXISTE: contra el portal real la consulta tarda cerca de medio minuto. Antes eso era
 * una pantalla quieta con la palabra "Consultando…", y quien la lanzaba no sabia si estaba
 * funcionando, si la clave habia sido aceptada o si se habia colgado. Lo peor no era la espera:
 * era no saber si valia la pena seguir esperando.
 *
 * Los pasos se muestran todos desde el principio, en gris, y se van marcando. Ver cuantos
 * faltan es la mitad de la informacion; la otra mitad es que el primero en marcarse sea entrar
 * al portal, porque eso responde de una la pregunta de si la clave estaba bien.
 */

import { AlertCircle, Check, Loader2, Minus } from "lucide-react";

const ICONOS = {
  DONE: <Check size={14} />,
  RUNNING: <Loader2 size={14} className="spin" />,
  EMPTY: <Minus size={14} />,
  FAILED: <AlertCircle size={14} />,
  PENDING: null,
};

export default function Progreso({ pasos }) {
  if (!pasos?.length) return null;

  return (
    <ol className="progreso">
      {pasos.map((paso) => (
        <li key={paso.key} className={`paso paso-${paso.state.toLowerCase()}`}>
          <span className="paso-marca">{ICONOS[paso.state]}</span>
          <span className="paso-texto">
            {paso.label}
            {paso.detail ? <span className="paso-detalle">{paso.detail}</span> : null}
          </span>
        </li>
      ))}
    </ol>
  );
}
