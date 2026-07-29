/**
 * ETAPA 4. El checklist final.
 *
 * Antes de dar algo por listo hay que poder ver POR QUE esta listo. Un boton solo, sin nada que
 * lo respalde, obliga a confiar; un checklist muestra que cada cosa se reviso y quien la reviso.
 *
 * Y cada linea que NO esta lista es un enlace a donde se arregla, no un reproche.
 */

import { AlertCircle, Check, ExternalLink } from "lucide-react";

import { api } from "./api";
import { useAction } from "./hooks";
import { ErrorApi } from "./componentes";
import { formatMoney } from "./formato";

export default function EtapaPresentar({ caseId, caso, conciliacion, peticiones, liquidacion, onIr, onCambio }) {
  const cerrar = useAction(() => api.cerrarLiquidacion(caseId));
  const yaLista = caso.status === "DRAFT_READY" || caso.status === "SUBMITTED";

  const sinDecidir = (conciliacion?.partidas ?? []).filter((p) => !p.resolucion).length;
  const porConfirmar = caso.flags.filter((f) => !f.resolved_at && f.severity !== "info").length;
  const porPedir = (peticiones ?? []).length;
  const bloqueo = conciliacion?.falta_para_liquidar;
  const actual = liquidacion?.actual;

  const puntos = [
    {
      listo: !porConfirmar,
      texto: porConfirmar
        ? `Falta confirmar ${porConfirmar} ${porConfirmar === 1 ? "cosa" : "cosas"} del reporte`
        : "Información del reporte confirmada",
      ir: "decisiones",
    },
    {
      listo: !sinDecidir,
      texto: sinDecidir
        ? `Faltan ${sinDecidir} ${sinDecidir === 1 ? "renglón" : "renglones"} por decidir`
        : "Todos los renglones decididos",
      ir: "decisiones",
    },
    {
      listo: !porPedir,
      texto: porPedir
        ? `${porPedir} ${porPedir === 1 ? "documento" : "documentos"} por pedirle al cliente`
        : "Soportes completos",
      ir: "decisiones",
    },
    {
      listo: Boolean(actual) && !bloqueo,
      texto: bloqueo || (actual ? "Borrador calculado" : "El borrador todavía no se puede calcular"),
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
            <span>{p.texto}</span>
            {p.listo ? null : (
              <button className="enlace-suave" onClick={() => onIr(p.ir)}>
                resolver
              </button>
            )}
          </li>
        ))}
      </ul>

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

      {yaLista ? (
        <a
          className="btn-grande"
          href="https://muisca.dian.gov.co"
          target="_blank"
          rel="noreferrer"
        >
          Continuar para firmar en la DIAN
          <ExternalLink size={15} />
        </a>
      ) : null}
    </section>
  );
}
