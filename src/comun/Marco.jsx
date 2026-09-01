import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, MessageCircle } from "lucide-react";

import { RACIMO } from "../contenido/datos";

/**
 * El marco del sitio publico: la cabecera y el pie.
 *
 * POR QUE SE EXTRAJO: estaban escritos dentro del componente de la portada, asi que la guia de
 * renta salio sin ninguno de los dos. Quedaba como una pantalla aparte, sin navegacion de vuelta
 * y sin la ruta de conversion al final, que en una pagina que entra desde un buscador es
 * justamente lo que hace falta: alguien llega por una duda y tiene que poder pasar al producto.
 *
 * LOS ENLACES SON ABSOLUTOS (`/#precio`, no `#precio`). Las secciones viven en la portada, asi que
 * desde la guia un ancla suelta no lleva a ninguna parte. Estando ya en la portada, el navegador
 * trata `/#precio` como un desplazamiento dentro del mismo documento, sin recargar.
 */

export function Logo({ light = false }) {
  return (
    <a
      className={`logo ${light ? "logo-light" : ""}`}
      href="/"
      onClick={(evento) => {
        // En la portada no vale la pena recargar: basta con subir.
        if (window.location.pathname === "/") {
          evento.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
    >
      <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
        <g stroke="currentColor" strokeWidth="3.3" strokeLinecap="round">
          <path d="M16 3.5v5" /><path d="M16 23.5v5" />
          <path d="M3.5 16h5" /><path d="M23.5 16h5" />
          <path d="m7.2 7.2 3.5 3.5" /><path d="m21.3 21.3 3.5 3.5" />
          <path d="m24.8 7.2-3.5 3.5" /><path d="m10.7 21.3-3.5 3.5" />
        </g>
      </svg>
      <span className="logo-word">Clara<span className="logo-dot">.</span></span>
    </a>
  );
}

/**
 * Los titulos del racimo son largos porque estan escritos para una pagina de resultados. En el pie
 * hace falta la version corta, y va aca para que el titulo largo siga siendo el bueno donde importa.
 */
const ENLACES_CORTOS = {
  "/declaracion-de-renta-2026": "Guía de renta 2026",
  "/sancion-por-no-declarar-renta": "Sanciones",
  "/deducciones-declaracion-de-renta": "Deducciones",
  "/como-declarar-renta-paso-a-paso": "Cómo declarar",
};

/**
 * El menu de guias, colgado de "Guia 2026".
 *
 * POR QUE: las tres paginas nuevas solo estaban en el pie y al final de cada articulo, o sea
 * enterradas. El menu principal es donde alguien las busca. Va como desplegable y no como cuatro
 * entradas sueltas porque el encabezado no tiene ancho para cuatro titulos, y porque agrupadas se
 * entiende que son un mismo tema.
 *
 * EL DISPARADOR ES UN ENLACE, NO UN BOTON, y eso resuelve un choque que si se sentia: con un boton
 * que alterna, el mouse entraba (abriendo el panel) y el clic inmediatamente lo cerraba, asi que en
 * escritorio el menu parpadeaba y no se podia usar.
 *
 * Con enlace, cada forma de navegar hace lo natural:
 *   mouse    el panel se abre al pasar por encima, y el clic lleva a la guia principal
 *   teclado  el panel se abre al enfocar, y Escape lo cierra
 *   tactil   no hay hover, asi que el primer toque abre el panel en vez de navegar
 *
 * El retardo al salir cubre el hueco entre el disparador y el panel: sin el, bajar el mouse hacia
 * el panel lo cerraba a mitad de camino.
 */
function MenuGuias() {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef(null);
  const cierre = useRef(0);

  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (evento) => {
      if (!caja.current?.contains(evento.target)) setAbierto(false);
    };
    const tecla = (evento) => {
      if (evento.key === "Escape") setAbierto(false);
    };
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("pointerdown", fuera);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  useEffect(() => () => clearTimeout(cierre.current), []);

  const entrar = () => {
    clearTimeout(cierre.current);
    setAbierto(true);
  };
  // El retardo evita que el panel se cierre al pasar por el hueco entre el boton y el panel.
  const salir = () => {
    cierre.current = setTimeout(() => setAbierto(false), 180);
  };

  const [principal, ...resto] = Object.values(RACIMO);

  return (
    <div
      className={`menu-guias ${abierto ? "abierto" : ""}`}
      ref={caja}
      onMouseEnter={entrar}
      onMouseLeave={salir}
    >
      <a
        className="menu-guias-boton"
        href={principal[0]}
        aria-expanded={abierto}
        aria-haspopup="true"
        onFocus={entrar}
        onClick={(evento) => {
          // Sin hover (pantalla tactil) el primer toque abre el panel en vez de navegar: si no,
          // nunca se verian las otras guias.
          if (!window.matchMedia("(hover: hover)").matches && !abierto) {
            evento.preventDefault();
            setAbierto(true);
          }
        }}
      >
        Guía 2026 <ChevronDown size={15} aria-hidden="true" />
      </a>

      <div className="menu-guias-panel" hidden={!abierto}>
        <span className="menu-guias-titulo">GUÍA 2026</span>
        <a className="menu-guias-principal" href={principal[0]}>
          <b>{principal[1]}</b>
          <small>{principal[2]}</small>
        </a>
        <ul>
          {resto.map(([ruta, titulo, resumen]) => (
            <li key={ruta}>
              <a href={ruta}>
                <b>{titulo}</b>
                <small>{resumen}</small>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const ENLACES = [
  ["/#como", "Cómo funciona"],
  ["/#precio", "Precio"],
  ["/#seguridad", "Seguridad"],
];

/**
 * La cabecera. `solida` la deja opaca desde el primer momento, que es lo que necesita una pagina
 * de lectura; en la portada empieza transparente sobre el hero y se vuelve opaca con el scroll.
 * `alCta` es opcional: sin el, el boton es un enlace a la portada, porque la guia no tiene el
 * conmutador de pantallas del prototipo.
 */
export function Cabecera({ solida = false, alCta = null, ctaTexto = "Averigua gratis" }) {
  return (
    <header className={`site-header ${solida ? "solid" : ""}`}>
      <div className="container nav-inner">
        <Logo light />
        <nav>
          {ENLACES.map(([destino, texto]) => (
            <a key={destino} href={destino}>{texto}</a>
          ))}
          <MenuGuias />
        </nav>
        {alCta ? (
          <button type="button" className="button button-primary" onClick={alCta}>
            {ctaTexto}
          </button>
        ) : (
          <a className="button button-primary" href="/">{ctaTexto}</a>
        )}
      </div>
    </header>
  );
}

export function Pie({ alCta = null }) {
  const cta = (contenido) =>
    alCta ? (
      <button className="footer-whatsapp" type="button" onClick={alCta}>{contenido}</button>
    ) : (
      <a className="footer-whatsapp" href="/">{contenido}</a>
    );

  return (
    <footer>
      <div className="container footer-shell">
        <div className="footer-lead">
          <div>
            <Logo light />
            <p>Impuestos claros para gente que tiene mejores cosas que hacer.</p>
          </div>
          {cta(
            <>
              <MessageCircle size={18} /> Habla con Clara <ArrowRight size={16} />
            </>,
          )}
        </div>
        <div className="footer-directory">
          <div>
            <span>PRODUCTO</span>
            <a href="/#como">Cómo funciona</a>
            <a href="/#precio">Precios</a>
            <a href="/declaracion-de-renta-2026">Guía de renta 2026</a>
          </div>
          <div>
            <span>CONFIANZA</span>
            <a href="/#seguridad">Seguridad</a>
            <a href="/#seguridad">Tratamiento de datos</a>
            <a href="/#precio">Garantía Clara</a>
          </div>
          <div>
            <span>GUÍAS</span>
            {Object.values(RACIMO).map(([ruta, titulo]) => (
              <a key={ruta} href={ruta}>
                {ENLACES_CORTOS[ruta] ?? titulo}
              </a>
            ))}
          </div>
        </div>
        <div className="footer-bottom">
          <div className="service-status"><i /> Todos los sistemas operando</div>
          <p>
            Clara no es la DIAN. Somos un servicio independiente que te ayuda a preparar tu
            declaración. Tú siempre firmas y presentas.
          </p>
          <span>© 2026 Clara Colombia</span>
        </div>
      </div>
    </footer>
  );
}
