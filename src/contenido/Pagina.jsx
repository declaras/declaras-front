import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

import Seo, { SITIO } from "../seo/Seo";
import { Cabecera, Pie } from "../comun/Marco";

/**
 * El armazon de una pagina de contenido: cabecera, indice lateral, columna de lectura y pie.
 *
 * POR QUE EXISTE: la guia lo tenia todo escrito adentro. Al agregar tres paginas mas habria cuatro
 * copias del mismo armazon, y ya paso una vez que una copia se quedara sin cabecera ni pie. Aca
 * tambien vive el armado de los datos estructurados, que es facil de escribir mal en silencio: un
 * @id repetido o una fecha que no coincide con la visible no rompen nada, solo dejan de servir.
 *
 * La columna es angosta a proposito: un parrafo de 1.400 pixeles no se lee. El indice ocupa el
 * espacio que sobra al lado y vuelve recorrible un texto largo.
 */

/** El indice, con la seccion que se esta leyendo resaltada. */
function Indice({ secciones, cta }) {
  const [activa, setActiva] = useState(secciones[0]?.[0]);

  useEffect(() => {
    // Se marca la ultima seccion cuyo comienzo ya paso por el tercio superior de la pantalla. Con
    // IntersectionObserver a secas, las secciones cortas nunca alcanzaban a quedar activas.
    let cuadro = 0;
    const mirar = () => {
      cuadro = 0;
      const limite = window.innerHeight * 0.32;
      let cual = secciones[0]?.[0];
      for (const [id] of secciones) {
        const nodo = document.getElementById(id);
        if (nodo && nodo.getBoundingClientRect().top <= limite) cual = id;
      }
      setActiva(cual);
    };
    const alDesplazar = () => {
      if (!cuadro) cuadro = requestAnimationFrame(mirar);
    };
    mirar();
    window.addEventListener("scroll", alDesplazar, { passive: true });
    return () => {
      window.removeEventListener("scroll", alDesplazar);
      if (cuadro) cancelAnimationFrame(cuadro);
    };
  }, [secciones]);

  return (
    <nav className="post-indice" aria-label="Contenido de la página">
      <h2>En esta página</h2>
      <ol>
        {secciones.map(([id, texto]) => (
          <li key={id} className={activa === id ? "activa" : ""}>
            <a href={`#${id}`} aria-current={activa === id ? "true" : undefined}>
              {texto}
            </a>
          </li>
        ))}
      </ol>
      <a className="post-indice-cta" href="/">
        {cta} <ArrowRight size={15} aria-hidden="true" />
      </a>
    </nav>
  );
}

/** Los enlaces a las otras paginas del tema. Sin esto, cada una queda aislada. */
export function Relacionadas({ items }) {
  if (!items?.length) return null;
  return (
    <nav className="post-relacionadas" aria-label="Otras páginas sobre la declaración de renta">
      <h2>Sigue leyendo</h2>
      <ul>
        {items.map(([ruta, titulo, resumen]) => (
          <li key={ruta}>
            <a href={ruta}>
              <b>{titulo}</b>
              <small>{resumen}</small>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Los datos estructurados de una pagina de contenido.
 *
 * Es una funcion aparte y no algo que arme el componente porque el prerenderizado los necesita sin
 * renderizar nada: los efectos no corren en el servidor, asi que el `<head>` se construye por fuera.
 * Al ser la misma funcion en los dos lados, no pueden discrepar.
 */
export function construirDatos({ ruta, h1, descripcion, publicado, migaja, preguntas = [] }) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${SITIO}${ruta}#articulo`,
        headline: h1,
        description: descripcion,
        inLanguage: "es-CO",
        datePublished: publicado,
        dateModified: publicado,
        author: { "@type": "Organization", name: "Clara", url: `${SITIO}/` },
        publisher: { "@id": `${SITIO}/#organizacion` },
        mainEntityOfPage: { "@type": "WebPage", "@id": `${SITIO}${ruta}` },
      },
      ...(preguntas.length
        ? [
            {
              "@type": "FAQPage",
              "@id": `${SITIO}${ruta}#preguntas`,
              mainEntity: preguntas.map(([pregunta, respuesta]) => ({
                "@type": "Question",
                name: pregunta,
                acceptedAnswer: { "@type": "Answer", text: respuesta },
              })),
            },
          ]
        : []),
      {
        "@type": "BreadcrumbList",
        "@id": `${SITIO}${ruta}#ruta`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Clara", item: `${SITIO}/` },
          { "@type": "ListItem", position: 2, name: migaja, item: `${SITIO}${ruta}` },
        ],
      },
    ],
  };
}

export default function Pagina({
  titulo,
  descripcion,
  ruta,
  imagen,
  h1,
  bajada,
  publicado,
  migaja,
  secciones,
  preguntas = [],
  cta = "Averigua gratis si debes declarar",
  children,
}) {
  const datos = construirDatos({ ruta, h1, descripcion, publicado, migaja, preguntas });

  return (
    <div className="post">
      <Seo
        titulo={titulo}
        descripcion={descripcion}
        ruta={ruta}
        tipo="article"
        imagen={imagen ? `${SITIO}${imagen}` : undefined}
        publicado={publicado}
        modificado={publicado}
        datos={datos}
      />

      <Cabecera solida />

      <header className="post-top">
        <div className="container post-ancho">
          <nav className="post-migas" aria-label="Ruta">
            <a href="/">Clara</a>
            <span aria-hidden="true">/</span>
            <span>{migaja}</span>
          </nav>
          <h1>{h1}</h1>
          <p className="post-bajada">{bajada}</p>
          <p className="post-fecha">
            <time dateTime={publicado}>Actualizado el 30 de julio de 2026</time> · Año gravable 2025
          </p>
        </div>
      </header>

      <main className="container post-cuerpo">
        <Indice secciones={secciones} cta={cta} />
        <article className="post-columna">{children}</article>
      </main>

      <Pie />
    </div>
  );
}
