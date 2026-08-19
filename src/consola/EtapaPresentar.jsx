/**
 * ETAPA 4. El checklist final.
 *
 * Antes de dar algo por listo hay que poder ver POR QUE esta listo. Un boton solo, sin nada que
 * lo respalde, obliga a confiar; un checklist muestra que cada cosa se reviso y quien la reviso.
 *
 * Y cada linea que NO esta lista es un enlace a donde se arregla, no un reproche.
 */

import { AlertCircle, Check, ExternalLink } from "lucide-react";

import { useState } from "react";

import { api } from "./api";
import { useAction, useApi } from "./hooks";
import { ErrorApi } from "./componentes";
import { formatMoney } from "./formato";
import Comparacion from "./Comparacion";
import { useVista } from "./vista";

export default function EtapaPresentar({ caseId, caso, conciliacion, peticiones, liquidacion, onIr, onCambio }) {
  const { profunda } = useVista();
  const cerrar = useAction(() => api.cerrarLiquidacion(caseId));
  const formulario = useApi(() => api.getFormulario(caseId), [caseId]);
  const comparacion = useApi(() => api.getComparacionDian(caseId), [caseId]);
  const yaLista = caso.status === "DRAFT_READY" || caso.status === "SUBMITTED";

  const sinDecidir = (conciliacion?.partidas ?? []).filter((p) => !p.resolucion).length;
  const porConfirmar = caso.flags.filter((f) => !f.resolved_at && f.severity !== "info").length;
  const porPedir = (peticiones ?? []).length;
  const bloqueo = conciliacion?.falta_para_liquidar;
  const actual = liquidacion?.actual;
  // Los avisos que impiden dar la declaración por buena. `cerrar_borrador` se niega si hay uno
  // solo, así que sin mirarlos esta pantalla decía "todo listo", ofrecía el botón, y el backend
  // devolvía un error: la pantalla que existe para responder "¿está todo?" contestaba mal.
  const bloqueantes = actual?.bloqueantes ?? [];
  // Las advertencias no impiden presentar, pero este es su único momento útil: dicen sobre qué
  // supuesto se calculó una cifra (un ingreso clasificado a mano, unos dividendos sin desagregar) y
  // si el supuesto no se cumple, el impuesto es otro. Enterrarlas en la memoria de cálculo es
  // enterrarlas: nadie las abre justo antes de firmar.
  const porRevisar = (actual?.flags ?? []).filter((f) => f.severidad === "advertencia");

  // Es la última pantalla antes de dar la declaración por lista, así que es la que menos puede
  // hablar en lenguaje de contador: "Todos los renglones decididos" y "Soportes completos" son
  // frases que solo confirman algo a quien ya sabe qué es un renglón y qué es un soporte.
  const puntos = [
    {
      listo: !porConfirmar,
      texto: porConfirmar
        ? profunda
          ? `Falta confirmar ${porConfirmar} ${porConfirmar === 1 ? "cosa" : "cosas"} del reporte`
          : `Falta que confirmes ${porConfirmar} ${porConfirmar === 1 ? "cosa" : "cosas"}`
        : profunda
          ? "Información del reporte confirmada"
          : "Revisamos lo que la DIAN tiene de ti",
      ir: "decisiones",
    },
    {
      listo: !sinDecidir,
      texto: sinDecidir
        ? profunda
          ? `Faltan ${sinDecidir} ${sinDecidir === 1 ? "renglón" : "renglones"} por decidir`
          : `Faltan ${sinDecidir} ${sinDecidir === 1 ? "pregunta" : "preguntas"} por contestar`
        : profunda
          ? "Todos los renglones decididos"
          : "Contestaste todo lo que te preguntamos",
      ir: "decisiones",
    },
    {
      listo: !porPedir,
      texto: porPedir
        ? profunda
          ? `${porPedir} ${porPedir === 1 ? "documento" : "documentos"} por pedirle al cliente`
          : `Falta que mandes ${porPedir} ${porPedir === 1 ? "documento" : "documentos"}`
        : profunda
          ? "Soportes completos"
          : "Están todos los documentos que hacen falta",
      ir: "decisiones",
    },
    {
      // Que la declaración se pueda calcular y que esté completa son dos cosas distintas: con un
      // ingreso por fuera el cálculo SÍ sale (se publica la liquidación con las elecciones por
      // defecto), y justamente por eso hace falta un punto aparte que diga que no está completa.
      listo: !bloqueantes.length,
      texto: bloqueantes.length
        ? profunda
          ? `${bloqueantes.length} ${bloqueantes.length === 1 ? "ingreso quedó" : "ingresos quedaron"} por fuera de la liquidación`
          : `Hay ${bloqueantes.length} ${bloqueantes.length === 1 ? "ingreso" : "ingresos"} que todavía no ${bloqueantes.length === 1 ? "está" : "están"} en tu declaración`
        : profunda
          ? "Ningún ingreso quedó por fuera"
          : "Todos tus ingresos están en la declaración",
      ir: "decisiones",
      detalles: bloqueantes.map((f) => f.mensaje),
    },
    {
      listo: Boolean(actual) && !bloqueo,
      texto:
        bloqueo ||
        (actual
          ? profunda
            ? "Borrador calculado"
            : "Tu declaración está calculada"
          : profunda
            ? "El borrador todavía no se puede calcular"
            : "Todavía no podemos calcular tu declaración"),
      ir: "borrador",
    },
  ];

  const todoListo = puntos.every((p) => p.listo);

  return (
    <section className="etapa-cuerpo">
      <h1 className="etapa-titulo">
        {yaLista ? "Declaración dada por lista" : "Antes de presentar"}
      </h1>

      {actual ? (
        <p className="presentar-cifra">
          <span className="money">{formatMoney(Math.abs(actual.saldo ?? 0))}</span>
          <span>{(actual.saldo ?? 0) >= 0 ? "a pagar" : "a favor"}</span>
        </p>
      ) : null}

      <ul className="checklist">
        {puntos.map((p) => (
          <li key={p.texto} className={p.listo ? "check-listo" : "check-falta"}>
            <span className="check-marca">
              {p.listo ? <Check size={13} /> : <AlertCircle size={13} />}
            </span>
            <span>
              {p.texto}
              {/* Cuál ingreso quedó por fuera, no solo cuántos: "2 ingresos" no le dice a nadie
                  qué tiene que ir a resolver. */}
              {!p.listo && p.detalles?.length ? (
                <span className="check-detalles">
                  {p.detalles.map((d) => (
                    <span className="check-detalle" key={d}>
                      {d}
                    </span>
                  ))}
                </span>
              ) : null}
            </span>
            {p.listo ? null : (
              <button className="enlace-suave" onClick={() => onIr(p.ir)}>
                resolver
              </button>
            )}
          </li>
        ))}
      </ul>

      {/* Antes del formulario: la pregunta "¿en qué difiere de lo que la DIAN espera?" se contesta
          antes de mirar las casillas una por una. */}
      <Comparacion comparacion={comparacion.data} error={comparacion.error} />

      {porRevisar.length ? (
        <section className="revisar">
          <h3 className="revisar-titulo">
            {porRevisar.length === 1
              ? "Una cosa para revisar antes de presentar"
              : `${porRevisar.length} cosas para revisar antes de presentar`}
          </h3>
          <p className="revisar-nota">
            {profunda
              ? "No bloquean el cierre, pero cada una dice sobre qué supuesto se calculó una cifra."
              : "No impiden presentar. Léelas: si algo de esto no es como dice, tu impuesto cambia."}
          </p>
          <ul className="revisar-lista">
            {porRevisar.map((f) => (
              <li key={f.codigo + f.mensaje.slice(0, 24)}>{f.mensaje}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* EL FORMULARIO QUE SE VA A RADICAR, y no los renglones que la exógena sugiere: eso es lo
          que la DIAN pondría con lo que ella sabe, y esto es lo que queda tras decidir. En un caso
          real la misma casilla traía cifras con millones de diferencia y nada lo decía. */}
      {formulario.data?.length ? <Formulario casillas={formulario.data} /> : null}

      {todoListo && !yaLista ? (
        <div className="presentar-cerrar">
          <button
            className="btn-grande"
            disabled={cerrar.running}
            onClick={async () => {
              if (await cerrar.run()) onCambio();
            }}
          >
            {cerrar.running ? "Guardando…" : "Dar la declaración por lista"}
          </button>
          <ErrorApi error={cerrar.error} />
          <p className="presentar-nota">
            Después de esto queda el paso que no podemos hacer nosotros: firmarla y presentarla en
            el portal de la DIAN con tu firma electrónica.
          </p>
        </div>
      ) : null}

      {yaLista ? <EscribirAlPortal caseId={caseId} profunda={profunda} /> : null}
    </section>
  );
}


/**
 * Escribir el borrador en el portal de la DIAN, que era lo que se hacia a mano.
 *
 * Aparece solo con la declaracion dada por lista: lo que sale de Clara hacia la cuenta real
 * del contribuyente tiene que haber pasado por el "dar por buena" del contador, y el backend
 * lo exige igual (409 si no).
 *
 * LA CLAVE SE PIDE AQUI Y NO SE GUARDA EN NINGUN LADO. Viaja en esta peticion, abre la
 * sesion y se suelta; el campo se limpia al terminar. Es el mismo trato que le da la
 * extraccion.
 *
 * EL RESULTADO MUESTRA LA VERIFICACION, no un "listo" a secas. Despues de guardar, el
 * backend relee el borrador completo y compara casilla por casilla: en el primer ensayo
 * real el portal respondio 201 habiendo corrompido una letra, asi que un 201 sin relectura
 * no prueba nada. Si algo volvio distinto, se muestra en rojo con lo enviado y lo leido.
 */
function EscribirAlPortal({ caseId, profunda }) {
  const [clave, setClave] = useState("");
  const [resultado, setResultado] = useState(null);
  const escribir = useAction((password) => api.escribirAlPortal(caseId, password));

  const enviar = async (evento) => {
    evento.preventDefault();
    const r = await escribir.run(clave);
    if (r) {
      setResultado(r);
      setClave("");
    }
  };

  return (
    <div className="portal-escribir">
      {!resultado ? (
        <form onSubmit={enviar}>
          <h3 className="revisar-titulo">Llevar el borrador al portal de la DIAN</h3>
          <p className="presentar-nota">
            {profunda
              ? "Clara llena el borrador del 210 en la cuenta del cliente, casilla por casilla, y verifica releyendo lo que quedó guardado. No firma ni presenta nada."
              : "Llenamos tu borrador en la DIAN con estas cifras y verificamos que quede igual. Firmar y presentar sigue siendo tuyo."}
          </p>
          <label className="campo portal-clave">
            <span>{profunda ? "Clave del portal del cliente" : "Tu clave del portal de la DIAN"}</span>
            <input
              type="password"
              autoComplete="off"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              required
            />
          </label>
          <button className="btn-grande" disabled={escribir.running || !clave}>
            {escribir.running ? "Escribiendo en el portal…" : "Escribir el borrador"}
          </button>
          <ErrorApi error={escribir.error} />
        </form>
      ) : (
        <ResultadoEscritura resultado={resultado} profunda={profunda} />
      )}
    </div>
  );
}

function ResultadoEscritura({ resultado, profunda }) {
  const { verificado, escritas, form_id: formId, diferencias, ajenas } = resultado;
  const numerosAjenos = Object.keys(ajenas ?? {});

  return (
    <div className={verificado ? "portal-resultado" : "portal-resultado portal-fallo"}>
      <p className="portal-veredicto">
        {verificado ? <Check size={15} /> : <AlertCircle size={15} />}
        {verificado
          ? `Borrador ${formId} escrito y verificado: las ${escritas} casillas quedaron como se enviaron.`
          : `El borrador ${formId} quedó DISTINTO de lo enviado. No lo firmes sin revisar esto:`}
      </p>

      {diferencias?.length ? (
        <ul className="portal-diferencias">
          {diferencias.map((d) => (
            <li key={d.casilla}>
              Casilla {d.casilla}: se envió {String(d.enviado)} y el portal guardó {String(d.leido)}
            </li>
          ))}
        </ul>
      ) : null}

      {numerosAjenos.length ? (
        <p className="presentar-nota">
          {profunda
            ? `El borrador además trae cifras que Clara no calcula (casillas ${numerosAjenos.join(", ")}): estaban en el portal y se conservaron. Revisarlas antes de firmar.`
            : "El borrador trae además unas cifras que ya estaban en el portal. Tu contador las revisa antes de la firma."}
        </p>
      ) : null}

      {verificado ? (
        <a className="btn-grande" href="https://muisca.dian.gov.co" target="_blank" rel="noreferrer">
          Entrar a la DIAN a firmar
          <ExternalLink size={15} />
        </a>
      ) : null}
    </div>
  );
}


/**
 * El 210 casilla por casilla, plegado.
 *
 * Plegado porque es la evidencia, no la respuesta: quien presenta ya vio la cifra arriba. Y con
 * los nombres oficiales, porque nadie deberia tener que saber que es "la casilla 97".
 *
 * Solo se muestran las casillas con cifra. Un formulario con treinta ceros esconde las seis que
 * importan, y las vacias no se declaran.
 */
function Formulario({ casillas }) {
  const { profunda } = useVista();
  const [abierto, setAbierto] = useState(false);
  const conCifra = casillas.filter((c) => c.valor);

  return (
    <div className="formulario">
      <button className="enlace-suave" onClick={() => setAbierto((v) => !v)} aria-expanded={abierto}>
        {abierto
          ? "Ocultar el formulario"
          : profunda
            ? `Ver el formulario 210 que se va a radicar (${conCifra.length} casillas con cifra)`
            : "Ver el formulario que se va a radicar"}
      </button>
      {abierto ? (
        <table className="tabla formulario-tabla">
          <thead>
            <tr>
              <th>Casilla</th>
              <th>Concepto</th>
              <th className="num">Valor</th>
            </tr>
          </thead>
          <tbody>
            {conCifra.map((c) => (
              <tr key={c.numero}>
                <td className="strong">{c.numero}</td>
                <td>{c.nombre}</td>
                <td className="num strong money">{formatMoney(c.valor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
