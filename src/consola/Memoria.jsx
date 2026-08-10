/**
 * La memoria de calculo.
 *
 * QUE ES Y POR QUE MERECE ESTAR BIEN PINTADA: es el documento que defiende la declaracion. Dice de
 * donde sale cada cifra, con que formula y con que articulo del Estatuto. Un contador la lee cuando
 * alguien pregunta "y este numero de donde salio", y es lo que se anexa si la DIAN requiere.
 *
 * ANTES ERA UN ENLACE A MARKDOWN CRUDO: se abria en otra pestana, con la tipografia por defecto del
 * navegador, los asteriscos a la vista y sin jerarquia. Un documento que respalda plata no puede
 * verse como un volcado.
 *
 * SE PINTA DESDE LOS DATOS, NO DESDE EL MARKDOWN, y NO PIDE NADA. Los pasos ya venian dentro de la
 * liquidacion (`liquidacion.actual.casillas`), que el borrador ya tiene cargada: cada nodo con su
 * etiqueta, su cifra, su formula y su regla en campos separados. Estrene un endpoint
 * `/pasos-del-calculo` para esto y era el mismo dato con otro nombre; se borro. El markdown sigue
 * existiendo en `/memoria` para descargar, y ahi si es lo correcto porque es lo que se anexa.
 *
 * DOS LECTURAS, UNA FUENTE. El titular quiere seguir el hilo de como se llego a lo que paga; el
 * contador quiere la formula y el articulo. Son la misma lista: al titular se le esconde la formula
 * y se le agrupa en etapas con nombre en espanol, al contador se le muestra todo.
 */

import { Download } from "lucide-react";

import { formatMoney } from "./formato";
import Cajon from "./Cajon";
import { useVista } from "./vista";
import { urlDeApi } from "./api";

/**
 * Las etapas del calculo, con el nombre que tienen para quien no es contador.
 *
 * LOS CODIGOS SON LOS REALES DEL MOTOR (`ORDEN_CASILLAS`), no un patron adivinado: se listan uno
 * por uno para que agregar una casilla al motor y no agruparla aca sea visible en vez de silencioso.
 * Un codigo que no aparezca en ninguna etapa cae en "Otros pasos" y se pinta igual, porque perder un
 * paso de la memoria sin que nadie lo note es exactamente lo que esta memoria existe para evitar.
 *
 * El orden dentro de cada etapa lo sigue mandando el backend: aca solo se reparte.
 */
const ETAPAS = [
  {
    id: "obligacion",
    titulo: "¿Tienes que declarar?",
    nota: "Basta con pasar uno de los cinco topes de la ley.",
    codigos: ["OBLIGADO_DECLARAR"],
  },
  {
    id: "patrimonio",
    titulo: "Lo que tienes",
    nota: "Tu patrimonio al 31 de diciembre.",
    codigos: ["PATRIMONIO_BRUTO", "PATRIMONIO_LIQUIDO"],
  },
  {
    id: "ingresos",
    titulo: "Lo que entró",
    nota: "Todo lo que te pagaron en el año.",
    codigos: ["ING_BRUTO_GENERAL"],
  },
  {
    id: "no_renta",
    titulo: "Lo que no cuenta como ingreso",
    nota: "Salud, pensión y otros aportes que la ley saca antes de calcular.",
    codigos: ["INCR_APORTES", "INCR_CI", "INCR_TOTAL", "ING_NETOS_GENERAL", "COSTOS_ARRIENDOS"],
  },
  {
    id: "beneficios",
    titulo: "Los beneficios que aplicaste",
    nota: "Deducciones y rentas exentas. La ley limita el total al 40%, y ese tope manda.",
    codigos: ["CAP_40", "DEDUCCIONES_LIMITADAS", "EXENTA_25", "APLICADO_40", "EXTRA_LIMITE"],
  },
  {
    id: "base",
    titulo: "Sobre cuánto se calcula",
    nota: "La base ya depurada. Es sobre esto que se aplica la tarifa.",
    codigos: ["RLG_GENERAL", "RLG_PENSIONES"],
  },
  {
    id: "dividendos",
    titulo: "Dividendos",
    nota: "Se calculan aparte del resto.",
    codigos: ["DIV_NO_GRAVADOS", "DIV_GRAVADOS", "IMP_DIV_35"],
  },
  {
    id: "impuesto",
    titulo: "El impuesto",
    nota: "La tarifa del artículo 241, que sube por tramos.",
    codigos: ["BASE_TABLA_241", "IMPUESTO_241"],
  },
  {
    id: "descuentos",
    titulo: "Descuentos del impuesto",
    nota: "Se restan del impuesto, no de la base.",
    codigos: ["DESCUENTO_254_1", "DESCUENTO_DONACIONES", "IMPUESTO_NETO"],
  },
  {
    id: "saldo",
    titulo: "Lo que queda",
    nota: "Después de restar lo que ya te retuvieron durante el año.",
    codigos: ["RETENCIONES", "ANTICIPO_SIGUIENTE", "SALDO"],
  },
];

const ETAPA_DE = new Map(ETAPAS.flatMap((e) => e.codigos.map((c) => [c, e.id])));
const OTROS = { id: "otros", titulo: "Otros pasos", nota: null };

/**
 * Si la etapa tiene un solo paso y ese paso dice lo mismo que el titulo o que la nota, sobra el
 * texto repetido.
 *
 * POR QUE SE COMPARA Y NO SE REESCRIBE: los titulos de etapa viven aca y los nombres de los pasos
 * viven en el backend (`en_palabras.py`), asi que cualquier ajuste en uno de los dos lados vuelve a
 * juntar o a separar los textos. Elegir palabras distintas a mano aguanta hasta el siguiente cambio;
 * comparar aguanta siempre. Pasaba con "LO QUE ENTRO / Todo lo que te pagaron en el ano. / Todo lo
 * que te pagaron en el ano", tres veces la misma frase en cuatro centimetros.
 */
const igual = (a, b) =>
  Boolean(a) &&
  Boolean(b) &&
  a
    .toLowerCase()
    .replace(/[.¿?]/g, "")
    .trim() ===
    b
      .toLowerCase()
      .replace(/[.¿?]/g, "")
      .trim();

export default function Memoria({ caseId, liquidacion, error, onCerrar }) {
  const { profunda } = useVista();
  const pasos = liquidacion?.actual?.casillas ?? [];

  const porEtapa = [...ETAPAS, OTROS]
    .map((etapa) => ({
      ...etapa,
      pasos: pasos.filter((p) => (ETAPA_DE.get(p.codigo) ?? "otros") === etapa.id),
    }))
    .filter((etapa) => etapa.pasos.length);

  return (
    <Cajon
      titulo="Memoria de cálculo"
      subtitulo={
        profunda
          ? "Cada cifra con su fórmula y su norma"
          : "De dónde sale cada número, paso por paso"
      }
      ancho={620}
      accion={
        <a
          className="btn-mini"
          href={urlDeApi(`/v1/cases/${caseId}/memoria`)}
          target="_blank"
          rel="noreferrer"
          title="Descargar para anexar o archivar"
        >
          <Download size={13} />
          Descargar
        </a>
      }
      onCerrar={onCerrar}
    >
      <div className="memoria">
        {porEtapa.map((etapa) => (
          <Etapa key={etapa.id} etapa={etapa} profunda={profunda} />
        ))}

        {!pasos.length ? (
          <p className="estado estado-motivo">
            {error ? error.message : "La memoria se genera cuando el cálculo esté hecho."}
            {error?.code ? <small>{error.code}</small> : null}
          </p>
        ) : null}
      </div>
    </Cajon>
  );
}

function Etapa({ etapa, profunda }) {
  const unico = etapa.pasos.length === 1 ? etapa.pasos[0] : null;
  const nombreUnico = unico && !profunda ? unico.en_palabras : unico?.etiqueta;
  const notaRepite = igual(nombreUnico, etapa.nota);
  const tituloRepite = igual(nombreUnico, etapa.titulo);

  return (
    <section className="memoria-etapa">
      <header className="memoria-etapa-top">
        {/* Con un solo paso que ya dice el título, la nota queda como el encabezado y el título
            desaparece: la nota explica, el título solo rotula. */}
        {tituloRepite ? null : <h3 className="memoria-etapa-titulo">{etapa.titulo}</h3>}
        {etapa.nota && !profunda && !notaRepite ? (
          <p className={tituloRepite ? "memoria-etapa-titulo-nota" : "memoria-etapa-nota"}>
            {etapa.nota}
          </p>
        ) : null}
      </header>
      <ol className="memoria-pasos">
        {etapa.pasos.map((paso) => (
          <Paso key={paso.codigo} paso={paso} profunda={profunda} />
        ))}
      </ol>
    </section>
  );
}

/**
 * Un paso.
 *
 * La cifra manda, la formula la explica y la norma la respalda; en ese orden, porque es el orden en
 * que alguien las necesita: primero cuanto, despues por que, y solo si desconfia, con que articulo.
 *
 * Al titular no se le muestra la formula (`ING_LAB + ING_HON - APORTE_OB` no le dice nada) pero SI
 * la norma, porque saber que un descuento sale del articulo 206 es lo que lo hace creible.
 */
function Paso({ paso, profunda }) {
  const esPlata = paso.tipo === "pesos";
  // Un cero se atenúa: "no aplicó" es información, pero no compite con las cifras que sí mueven.
  const enCero = esPlata && paso.valor === 0;

  return (
    <li className={enCero ? "memoria-paso memoria-paso-cero" : "memoria-paso"}>
      <div className="memoria-paso-linea">
        {/* El backend manda los dos nombres del mismo paso. Al contador le sirve "INCRNGO aportes
            obligatorios salud/pensión" para defender la cifra; al titular no le dice nada. */}
        <span className="memoria-paso-etiqueta">
          {profunda ? paso.etiqueta : paso.en_palabras}
        </span>
        <span className={esPlata ? "memoria-paso-valor money" : "memoria-paso-valor"}>
          {/* Un paso `si_no` vale 1 o 0 y no es plata: OBLIGADO_DECLARAR se veía como "$ 1". El
              backend dice de qué tipo es (`tipo`) y aquí se le da forma, igual que con la plata. */}
          {esPlata ? formatMoney(paso.valor) : paso.valor ? "Sí" : "No"}
        </span>
      </div>
      {profunda && paso.formula ? (
        <p className="memoria-paso-formula">{paso.formula}</p>
      ) : null}
      {paso.regla ? <p className="memoria-paso-regla">{paso.regla}</p> : null}
      {profunda && paso.codigo ? <span className="memoria-paso-codigo">{paso.codigo}</span> : null}
    </li>
  );
}
