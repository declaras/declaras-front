/**
 * El patrimonio: lo unico de la declaracion que NADIE reporta.
 *
 * ═══ POR QUE ES UN CUESTIONARIO Y NO UN CAMPO ═══
 *
 * Todo lo demas de esta consola llega solo y se confirma. Esto no: ninguna notaria le reporta a la
 * DIAN, año tras año, que alguien SIGUE siendo dueño de su apartamento. Reporta la compraventa el
 * año en que ocurrio y nunca mas. Asi que si nadie pregunta, la casa no existe en la declaracion.
 *
 * ═══ LO QUE YA ESTA CONTADO SE MUESTRA ANTES DE PREGUNTAR ═══
 *
 * Los saldos bancarios y las cesantias SI vienen en la exogena y ya suman a la casilla 29. Ponerlos
 * a la vista arriba, antes de las preguntas, evita el peor error de este cuestionario, que es
 * pedirle a un cliente el extracto de una cuenta que el sistema ya tenia contada. La pregunta que
 * mas cuesta no es la dificil: es la que no habia que hacer.
 *
 * ═══ LA CIFRA VIENE CON SU REGLA ═══
 *
 * Cada bien muestra de donde sale su valor, porque las dos reglas no son la misma y confundirlas es
 * el error caro. Un inmueble va por el MAYOR entre lo que costo y el avaluo del predial (art. 277);
 * un vehiculo va por lo que costo, y el avaluo del impuesto vehicular —que es el papel que todo el
 * mundo tiene a mano— no sirve para esa casilla (art. 267). El backend manda la regla ya redactada:
 * aca no se reimplementa, porque dos redacciones de la misma regla acaban diciendo cosas distintas.
 */

import { useState } from "react";
import { Check, Plus, Trash2, X } from "lucide-react";

import { api } from "./api";
import { useAction } from "./hooks";
import { formatMoney } from "./formato";
import { ErrorApi } from "./componentes";
import { useVista } from "./vista";
import CampoNumero from "../comun/CampoNumero";

/** Como se llama cada familia cuando hay que nombrarla en un boton o un titulo. */
const NOMBRE = {
  inmueble: { uno: "un inmueble", varios: "Inmuebles" },
  vehiculo: { uno: "un vehículo", varios: "Carros y motos" },
  // "otro bien" daba "Agregar otro bien" con la lista todavia vacia, o sea prometiendo un
  // segundo bien cuando no habia ni el primero. "un bien" sirve para los dos momentos.
  otro: { uno: "un bien", varios: "Otros bienes" },
};

export default function Patrimonio({ caseId, datos, onCambio }) {
  const { profunda } = useVista();
  // Los datos NO se piden aca. Los pide quien monta el expediente y los pasa, por la misma razon
  // por la que la etapa necesita saber si el patrimonio esta completo para dejar seguir: con dos
  // lecturas distintas de lo mismo, la pantalla y la compuerta podrian discrepar sobre si falta
  // algo, y la que se veria seria la pantalla.
  if (!datos) return null;

  return (
    <section className="bloque">
      <header className="bloque-top">
        <h2 className="bloque-titulo">
          {profunda ? "Patrimonio a 31 de diciembre" : "Lo que tienes a tu nombre"}
        </h2>
        <p className="bloque-nota">
          {profunda
            ? "La DIAN ve los saldos bancarios y las cesantías. Los inmuebles y los vehículos no los reporta nadie."
            : "La DIAN ya sabe cuánto tenías en el banco. Lo que no sabe es si tienes casa o carro."}
        </p>
      </header>

      <div className="bloque-cuerpo">
        <Cuenta datos={datos} profunda={profunda} />
        <YaContado reportados={datos.reportados} deudas={datos.deudas_reportadas} />

        {datos.preguntas.map((pregunta) => (
          <Compuerta
            key={pregunta.pregunta}
            caseId={caseId}
            pregunta={pregunta}
            bienes={datos.bienes.filter((b) => b.tipo === pregunta.tipo)}
            onCambio={onCambio}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * La suma, arriba y no al final.
 *
 * Va primero porque es la respuesta a la pregunta que alguien trae cuando abre esta pantalla ("¿en
 * cuánto va mi patrimonio?"), y porque el numero del año pasado al lado es lo que convierte el
 * cuestionario en algo que se puede verificar: si el año pasado declaro 180 millones y este año
 * vamos en 12, falta algo, y eso se ve sin leer una sola pregunta.
 */
function Cuenta({ datos, profunda }) {
  const anterior = datos.patrimonio_liquido_anterior;
  const liquido = datos.total_bruto - datos.total_deudas;
  const bajo = anterior != null && anterior > 0 && liquido < anterior;

  return (
    <div className="patrimonio-cuenta">
      <dl>
        <div>
          <dt>{profunda ? "Patrimonio bruto (casilla 29)" : "Todo lo que tienes"}</dt>
          <dd className="strong">{formatMoney(datos.total_bruto)}</dd>
        </div>
        <div>
          <dt>{profunda ? "Deudas (casilla 30)" : "Lo que debes"}</dt>
          <dd>{formatMoney(datos.total_deudas)}</dd>
        </div>
        <div>
          <dt>{profunda ? "Patrimonio líquido (casilla 31)" : "Tu patrimonio"}</dt>
          <dd className="strong">{formatMoney(liquido)}</dd>
        </div>
      </dl>

      {bajo ? (
        // El patrimonio no baja solo. Si bajo, o se vendio algo o falta algo, y las dos cosas
        // hay que resolverlas antes de presentar.
        <p className="patrimonio-alerta">
          El año pasado declaraste {formatMoney(anterior)} y hoy vamos en {formatMoney(liquido)}.
          Si no vendiste nada, falta algo por registrar.
        </p>
      ) : null}
    </div>
  );
}

/** Lo que llego solo. No se pregunta, se muestra, para que nadie lo pida dos veces. */
function YaContado({ reportados, deudas }) {
  const [abierto, setAbierto] = useState(false);
  const total = reportados.length + deudas.length;
  if (!total) return null;

  return (
    <div className="patrimonio-contado">
      <button className="enlace-suave" onClick={() => setAbierto((v) => !v)} aria-expanded={abierto}>
        {total === 1 ? "1 cosa que ya está contada" : `${total} cosas que ya están contadas`}
      </button>
      {abierto ? (
        <ul className="patrimonio-lista-contada">
          {reportados.map((r, i) => (
            <li key={`a${i}`}>
              <span>{r.descripcion}</span>
              <span className="num">{formatMoney(r.valor)}</span>
            </li>
          ))}
          {deudas.map((d, i) => (
            <li key={`d${i}`}>
              <span>{d.descripcion}</span>
              <span className="num">−{formatMoney(d.valor)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * Una pregunta con sus tres estados: sin contestar, contestada que no, contestada que si.
 *
 * "Sin contestar" y "contesto que no" se ven distinto A PROPOSITO. Son lo mismo en la casilla y
 * cosas opuestas para quien revisa: una es una pregunta que nadie hizo y la otra es un hecho que
 * el cliente afirmo. Pintarlas igual borraria esa diferencia justo donde importa, que es cuando
 * alguien pregunta por que la declaracion no tiene el carro.
 */
function Compuerta({ caseId, pregunta, bienes, onCambio }) {
  const { profunda } = useVista();
  const [agregando, setAgregando] = useState(false);
  const responder = useAction((tiene) =>
    api.postRespuesta(caseId, { pregunta: pregunta.pregunta, tiene }),
  );

  const contestar = async (tiene) => {
    if (await responder.run(tiene)) {
      setAgregando(tiene && !bienes.length);
      onCambio();
    }
  };

  if (pregunta.contestada === false && !bienes.length) {
    return (
      <div className="patrimonio-compuerta patrimonio-compuerta-no">
        <p>
          <X size={14} /> {NOMBRE[pregunta.tipo].varios}: no tiene
        </p>
        <button className="enlace-suave" onClick={() => contestar(true)}>
          corregir
        </button>
      </div>
    );
  }

  // UN BIEN CARGADO CONTESTA SU PROPIA PREGUNTA, igual que en el backend. Sin esta mitad, un bien
  // que entró por otra puerta (el agente por WhatsApp, una carga del contador) se veía debajo de
  // una pregunta que decía "¿tienes carro?" con el carro ya en la lista.
  if (pregunta.contestada == null && !bienes.length) {
    return (
      <div className="patrimonio-compuerta">
        <p className="patrimonio-pregunta">{pregunta.texto}</p>
        <p className="patrimonio-porque">{pregunta.por_que}</p>
        {profunda ? <p className="patrimonio-documento">{pregunta.documento}</p> : null}
        <div className="peticion-botones">
          <button className="btn-mini" disabled={responder.running} onClick={() => contestar(true)}>
            <Check size={14} /> Sí
          </button>
          <button
            className="btn-mini"
            disabled={responder.running}
            onClick={() => contestar(false)}
          >
            <X size={14} /> No
          </button>
        </div>
        <ErrorApi error={responder.error} />
      </div>
    );
  }

  return (
    <div className="patrimonio-compuerta">
      <p className="patrimonio-pregunta">{NOMBRE[pregunta.tipo].varios}</p>
      <ul className="patrimonio-bienes">
        {bienes.map((bien) => (
          <Bien key={bien.id} caseId={caseId} bien={bien} onCambio={onCambio} />
        ))}
      </ul>

      {agregando ? (
        <Formulario
          caseId={caseId}
          tipo={pregunta.tipo}
          onListo={() => {
            setAgregando(false);
            onCambio();
          }}
          onCancelar={() => setAgregando(false)}
        />
      ) : (
        <div className="patrimonio-acciones">
          <button className="btn-mini" onClick={() => setAgregando(true)}>
            <Plus size={13} /> Agregar {NOMBRE[pregunta.tipo].uno}
          </button>
          {!bienes.length ? (
            <button className="enlace-suave" onClick={() => contestar(false)}>
              en realidad no tengo
            </button>
          ) : null}
        </div>
      )}
      <ErrorApi error={responder.error} />
    </div>
  );
}

function Bien({ caseId, bien, onCambio }) {
  const { profunda } = useVista();
  const [editando, setEditando] = useState(false);
  const borrar = useAction(() => api.borrarBien(caseId, bien.id));

  if (editando) {
    return (
      <li className="patrimonio-bien">
        <Formulario
          caseId={caseId}
          tipo={bien.tipo}
          inicial={bien}
          onListo={() => {
            setEditando(false);
            onCambio();
          }}
          onCancelar={() => setEditando(false)}
        />
      </li>
    );
  }

  return (
    <li className="patrimonio-bien">
      <button className="patrimonio-bien-principal" onClick={() => setEditando(true)}>
        <span className="patrimonio-bien-nombre">
          {bien.descripcion}
          {bien.identificacion ? (
            <span className="patrimonio-bien-id">{bien.identificacion}</span>
          ) : null}
        </span>
        <span className="num strong">{formatMoney(bien.valor)}</span>
      </button>

      {/* LA REGLA VA EN SU PROPIA LINEA Y A LA IZQUIERDA. Debajo de la cifra y alineada a la
          derecha partia en dos con la ultima palabra sola ("...(art. | 277)"), que se lee como un
          renglon roto. Es una frase, no una etiqueta, y las frases se leen desde el margen.

          EL ARTICULO SOLO PARA EL CONTADOR. Es lo que el va a citar si la DIAN pregunta; al
          titular le pone un numero de norma en medio de una frase que iba entendiendo. */}
      <p className="patrimonio-bien-regla">
        {bien.regla}
        {profunda && bien.norma ? <span className="patrimonio-bien-norma">{bien.norma}</span> : null}
      </p>

      {bien.deuda_saldo ? (
        <p className="patrimonio-bien-deuda">
          debe {formatMoney(bien.deuda_saldo)}
          {bien.deuda_acreedor ? ` a ${bien.deuda_acreedor}` : ""}
        </p>
      ) : null}

      {bien.falta ? <p className="patrimonio-bien-falta">{bien.falta}</p> : null}

      <button
        className="btn-icono"
        onClick={async () => {
          if (await borrar.run()) onCambio();
        }}
        disabled={borrar.running}
        title={borrar.error ? borrar.error.message : "Quitar"}
      >
        <Trash2 size={14} />
      </button>
    </li>
  );
}

/**
 * El formulario de un bien. Los campos cambian con el tipo porque las reglas son distintas.
 *
 * NO SE PIDE EL AVALUO DEL IMPUESTO VEHICULAR, y la ausencia es deliberada: es el papel que la
 * gente tiene a mano y el que van a querer usar, y no es el valor que pide la ley. Un campo para
 * el garantizaria que alguien lo llene y que la casilla quede corta.
 */
function Formulario({ caseId, tipo, inicial, onListo, onCancelar }) {
  const [campos, setCampos] = useState(() => ({
    descripcion: inicial?.descripcion ?? "",
    identificacion: inicial?.identificacion ?? "",
    costo_adquisicion: inicial?.costo_adquisicion ?? "",
    avaluo_catastral: inicial?.avaluo_catastral ?? "",
    deuda_saldo: inicial?.deuda_saldo ?? "",
    deuda_acreedor: inicial?.deuda_acreedor ?? "",
  }));
  const guardar = useAction((bien) => api.guardarBien(caseId, bien));

  const poner = (campo) => (valor) => setCampos((c) => ({ ...c, [campo]: valor }));
  const numero = (valor) => (String(valor).length ? Number(valor) : null);

  const enviar = async (evento) => {
    evento.preventDefault();
    const bien = {
      // El id lo pone el cliente para que corregir sea la misma operacion que crear: el caso
      // normal es capturar sin el papel y completar cuando llega, y con solo alta y baja cada
      // correccion dejaria un duplicado.
      id: inicial?.id ?? crypto.randomUUID(),
      tipo,
      descripcion: campos.descripcion.trim(),
      identificacion: campos.identificacion.trim() || null,
      costo_adquisicion: numero(campos.costo_adquisicion),
      avaluo_catastral: tipo === "inmueble" ? numero(campos.avaluo_catastral) : null,
      deuda_saldo: numero(campos.deuda_saldo),
      deuda_acreedor: campos.deuda_acreedor.trim() || null,
    };
    if (await guardar.run(bien)) onListo();
  };

  return (
    <form className="patrimonio-form" onSubmit={enviar}>
      <ErrorApi error={guardar.error} />

      <label className="campo">
        <span>{tipo === "inmueble" ? "Qué es y dónde queda" : "Qué es"}</span>
        <input
          value={campos.descripcion}
          onChange={(e) => poner("descripcion")(e.target.value)}
          placeholder={
            tipo === "inmueble" ? "Apartamento 502, Calle 100 #15-20" : "Mazda 3 gris modelo 2019"
          }
          required
        />
      </label>

      <label className="campo">
        <span>{tipo === "inmueble" ? "Matrícula inmobiliaria" : "Placa"} (si la tienes a mano)</span>
        <input
          value={campos.identificacion}
          onChange={(e) => poner("identificacion")(e.target.value)}
          placeholder={tipo === "inmueble" ? "050C-1234567" : "ABC123"}
        />
      </label>

      {/* `CampoNumero` rinde un fragmento (`<label>` + `<input>`) sin envoltorio, porque en la web
          publica quien lo usa pone el suyo. Dentro de una rejilla eso deja la etiqueta y el campo
          como DOS celdas distintas: la etiqueta a la izquierda y la caja a la derecha, sin relación
          visible. El envoltorio lo pone quien lo usa, que es acá. */}
      <div className="fila-campos">
        <div className="campo">
          <CampoNumero
            etiqueta="En cuánto lo compraste"
            valor={campos.costo_adquisicion}
            alCambiar={poner("costo_adquisicion")}
            placeholder="$0"
          />
        </div>
        {tipo === "inmueble" ? (
          <div className="campo">
            <CampoNumero
              etiqueta="Avalúo del predial"
              valor={campos.avaluo_catastral}
              alCambiar={poner("avaluo_catastral")}
              placeholder="$0"
            />
          </div>
        ) : null}
      </div>

      {/* LA DEUDA VA EN EL MISMO FORMULARIO, no en una lista aparte. Capturar la casa sin la
          hipoteca infla el patrimonio líquido y dispara la alerta de comparación patrimonial en
          todo caso con inmueble financiado: es un dato a medias que hace daño. */}
      <div className="fila-campos">
        <div className="campo">
          <CampoNumero
            etiqueta="Si tiene crédito, cuánto debías el 31 de diciembre"
            valor={campos.deuda_saldo}
            alCambiar={poner("deuda_saldo")}
            placeholder="$0"
          />
        </div>
        <label className="campo">
          <span>A quién</span>
          <input
            value={campos.deuda_acreedor}
            onChange={(e) => poner("deuda_acreedor")(e.target.value)}
            placeholder="Bancolombia"
          />
        </label>
      </div>

      <div className="clave-botones">
        <button className="btn-grande" disabled={guardar.running || !campos.descripcion.trim()}>
          {guardar.running ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" className="enlace-suave" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
