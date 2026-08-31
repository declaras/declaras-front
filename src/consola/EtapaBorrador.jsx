/**
 * ETAPA 3. El borrador, por categorias.
 *
 * ACA SI VAN PESTANAS, y es el unico sitio donde tienen sentido: el contenido es homogeneo
 * (cuatro vistas del mismo borrador) y se navega libre, sin orden. Como estructura de la pantalla
 * completa serian una trampa, porque permitirian saltarse el proceso.
 *
 * Cada categoria muestra su total y se abre para ver las cifras con su fuente. El detalle no se
 * niega: se revela cuando alguien lo pide. La tabla completa con formula y norma vive un paso mas
 * adentro, en la memoria de calculo, que es un documento de auditoria y no una pantalla.
 */

import { useState } from "react";

import { Cruzar } from "./componentes";
import { ArrowRight, ChevronDown, ChevronRight } from "lucide-react";

import { formatMoney } from "./formato";
import Memoria from "./Memoria";
import Comparacion from "./Comparacion";
import Recomendaciones from "./Recomendaciones";
import { useVista } from "./vista";

const PESTANAS = [
  { id: "resumen", nombre: "Resumen" },
  { id: "ingresos", nombre: "Ingresos" },
  { id: "beneficios", nombre: "Beneficios" },
  // La comparación va en su propia pestaña y no dentro del resumen: son dos formularios enteros
  // enfrentados, y mezclarla con las cifras propias hace dudar de cuál es cuál.
  //
  // Aquí hubo una pestaña "Soportes" con los documentos, y era el único sitio de toda la
  // pantalla donde se podían ver: quien no había llegado a esta etapa no tenía cómo abrirlos.
  // Ahora viven en el carril lateral, visibles desde cualquier etapa.
  { id: "comparar", nombre: "Comparar" },
];

export default function EtapaBorrador({ caseId, resumen, liquidacion, liquidacionError, recomendaciones, comparaciones, onCambio }) {
  const { profunda } = useVista();
  const [pestana, setPestana] = useState("resumen");
  const [memoriaAbierta, setMemoriaAbierta] = useState(false);

  return (
    <section className="etapa-cuerpo">
      <h1 className="etapa-titulo">Tu borrador</h1>

      <div className="pestanas" role="tablist">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={pestana === p.id}
            className={pestana === p.id ? "pestana pestana-activa" : "pestana"}
            onClick={() => setPestana(p.id)}
          >
            {p.nombre}
          </button>
        ))}
      </div>

      {pestana === "resumen" ? (
        <Resumen
          caseId={caseId}
          liquidacion={liquidacion}
          error={liquidacionError}
          resumen={resumen}
          onCambio={onCambio}
        />
      ) : null}
      {pestana === "ingresos" ? (
        <Renglones lineas={resumen?.form_lines} profunda={profunda} />
      ) : null}
      {pestana === "beneficios" ? (
        <>
          {/* Las recomendaciones van PRIMERO: son lo único de esta pestaña sobre lo que se puede
              actuar. Las facturas electrónicas son un dato que ya está contado. */}
          <Recomendaciones recomendaciones={recomendaciones} />
          <Facturas facturas={resumen?.einvoices} />
        </>
      ) : null}
      {pestana === "comparar" ? (
        <div className="comparar">
          <p className="bloque-nota">
            {profunda
              ? "El formulario que se va a radicar contra las otras dos versiones del mismo 210. Son preguntas distintas y van separadas."
              : "Tu declaración comparada con lo que otros tienen. Son dos cosas distintas y por eso van aparte."}
          </p>

          <section className="comparar-bloque">
            <h3 className="comparar-titulo">
              {profunda ? "Contra el borrador de la DIAN" : "Contra lo que la DIAN tenía"}
            </h3>
            <p className="comparar-nota">
              {profunda
                ? "Lo que la DIAN precargó con lo que los terceros le reportaron. Las diferencias son lo que aportó el trabajo con documentos."
                : "La DIAN precarga un borrador con lo que otros reportaron de ti. Las diferencias son lo que agregamos nosotros."}
            </p>
            <Comparacion
              comparacion={comparaciones?.dian?.data}
              error={comparaciones?.dian?.error}
            />
          </section>

          <section className="comparar-bloque">
            <h3 className="comparar-titulo">
              {profunda ? "Contra la declaración presentada" : "Contra lo que se declaró ese año"}
            </h3>
            <p className="comparar-nota">
              {profunda
                ? "Lo que de verdad se radicó ese año gravable, que en un año viejo es el trabajo de un contador. Cada diferencia es un beneficio que él no tomó o un error nuestro."
                : "Si ese año ya declaraste, acá se ve en qué difiere nuestro cálculo de lo que se presentó. Sirve para saber si dejaste plata sobre la mesa."}
            </p>
            <Comparacion
              comparacion={comparaciones?.presentada?.data}
              error={comparaciones?.presentada?.error}
            />
          </section>
        </div>
      ) : null}


      <button className="enlace-suave abrir-memoria" onClick={() => setMemoriaAbierta(true)}>
        Ver la memoria de cálculo <ArrowRight size={13} />
      </button>

      {memoriaAbierta ? (
        <Memoria
          caseId={caseId}
          liquidacion={liquidacion}
          error={liquidacionError}
          onCerrar={() => setMemoriaAbierta(false)}
        />
      ) : null}
    </section>
  );
}

/** Las categorias del 210 con su total, abribles. */
function Resumen({ caseId, liquidacion, error, resumen, onCambio }) {
  const actual = liquidacion?.actual;

  // UN ERROR NO ES UN VACIO, y confundirlos costo horas. El backend responde 409 con el motivo
  // exacto ("quedan 3 partidas sin resolver", "hay que conciliar antes de calcular") y esto lo
  // mostraba como "todavia no hay borrador", que suena a que no hay nada que hacer. El mensaje
  // dice justamente lo que hay que hacer.
  if (error) {
    // Cuando el motivo es que falta cruzar, la accion que lo arregla va AQUI MISMO. Decirle a
    // alguien que hay que conciliar y dejarlo buscando donde hacerlo es media respuesta; y hasta
    // hace poco no habia donde, porque el metodo del API no lo llamaba nadie.
    const cruzando = /conciliar|cruzad/i.test(error.message ?? "");
    return (
      <div className="estado estado-motivo">
        <p>{error.message}</p>
        {cruzando ? <Cruzar caseId={caseId} onCambio={onCambio} /> : null}
        {error.code ? <small>{error.code}</small> : null}
      </div>
    );
  }
  if (!actual) return <p className="estado">Todavía no hay borrador que mostrar.</p>;

  return (
    <div className="categorias">
      <Categoria nombre="Impuesto" total={actual.impuesto}>
        <p className="bloque-nota">
          Lo que resulta de aplicar la tabla del artículo 241 a tu renta gravable.
        </p>
      </Categoria>
      <Categoria nombre={actual.saldo >= 0 ? "Saldo a pagar" : "Saldo a favor"} total={Math.abs(actual.saldo)}>
        <p className="bloque-nota">
          El impuesto menos lo que ya te retuvieron durante el año, más el anticipo del año
          siguiente si aplica.
        </p>
      </Categoria>
      {resumen?.obligation ? (
        <Categoria nombre="Topes de obligación" total={null}>
          <ul className="topes-simples">
            {resumen.obligation.thresholds.map((t) => (
              <li key={t.code} className={t.exceeded ? "tope-si" : ""}>
                <span>{t.label}</span>
                <span className="money">{formatMoney(t.reported_amount)}</span>
                <span className="tope-veredicto">
                  {t.exceeded ? "supera el tope" : `${Math.round((t.reported_amount / t.limit_amount) * 100)}%`}
                </span>
              </li>
            ))}
          </ul>
        </Categoria>
      ) : null}
    </div>
  );
}

function Categoria({ nombre, total, children }) {
  const [abierta, setAbierta] = useState(false);
  return (
    <div className="categoria">
      <button onClick={() => setAbierta((v) => !v)} aria-expanded={abierta}>
        {abierta ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        <span className="categoria-nombre">{nombre}</span>
        {total !== null ? <span className="categoria-total money">{formatMoney(total)}</span> : null}
      </button>
      {abierta ? <div className="categoria-cuerpo">{children}</div> : null}
    </div>
  );
}

/**
 * Los renglones que la DIAN sugiere, con el nombre que cada quien entiende.
 *
 * TRES VERSIONES DE LO MISMO, y las dos primeras estaban mal:
 *
 *   "R100"                                          un codigo que hay que memorizar
 *   "Ingresos no constitutivos de renta (pensiones)" el nombre oficial: correcto y de contador
 *   "Aportes de salud que te descontaron de la pension"  el mismo renglon, en espanol
 *
 * El backend manda el segundo y el tercero (`label` y `en_palabras`), y aca se elige segun quien
 * mira. El numero solo aparece en la vista de contador: al titular no le dice nada, y al contador
 * le sirve para ir al formulario, que es la razon por la que existe.
 */
function Renglones({ lineas, profunda }) {
  if (!lineas?.length) return <p className="estado">Sin renglones que mostrar.</p>;
  return (
    <>
      <p className="bloque-nota">
        {profunda
          ? "Lo que la DIAN asigna a cada renglón con lo que los terceros le reportaron. Es su sugerencia, no la declaración final."
          : "Así reparte la DIAN lo que otros reportaron a tu nombre. Es su sugerencia; tu declaración final puede cambiar."}
      </p>
      <table className="tabla">
        <thead>
          <tr>
            <th>Concepto</th>
            <th className="num">Valor</th>
          </tr>
        </thead>
        <tbody>
          {lineas.map((l) => (
            <tr key={l.line}>
              <td>
                {profunda ? l.label : l.en_palabras}
                {profunda ? <span className="renglon-numero">R{l.line}</span> : null}
              </td>
              <td className="num strong money">{formatMoney(l.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function Facturas({ facturas }) {
  if (!facturas?.invoice_count) return <p className="estado">Sin beneficios registrados.</p>;
  const deduccion = Math.round(facturas.benefit_eligible_amount * 0.01);
  return (
    <div className="cifra-grande">
      <span className="cifra-valor money">{formatMoney(deduccion)}</span>
      <span className="cifra-nombre">
        del 1% por tus facturas electrónicas, sobre{" "}
        {formatMoney(facturas.benefit_eligible_amount)}
      </span>
    </div>
  );
}
