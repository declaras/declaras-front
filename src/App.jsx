import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  FileCheck2,
  Globe,
  HelpCircle,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import heroHorizonte from "./assets/clara-hero-montanas.jpg";
import Seo, { SITIO } from "./seo/Seo";
import { PAGINAS } from "./seo/paginas";
import { Cabecera, Pie } from "./comun/Marco";
import { Avatar, Button } from "./comun/piezas";
import { referenciaDeAnuncio, registrar, registrarAperturaDeChat } from "./comun/medicion";
import { MENSAJES } from "./comun/mensajes";
import Promo from "./comun/Promo";
import Consulta from "./comun/Consulta";
import ConsultaRapida from "./comun/ConsultaRapida";
import { pesos, PRECIO, RACIMO } from "./contenido/datos";
import phoneArtwork from "./assets/clara-phone-cutout.png";
import phoneArtworkWebp from "./assets/clara-phone-cutout.webp";

const SCREENS = [
  ["landing", "Landing"],
  ["connection", "Conexión DIAN"],
  ["review", "Revisión"],
  ["optimization", "Optimización"],
  ["payment", "Pago"],
  ["whatsapp", "WhatsApp"],
];





function ScreenTabs({ active, onChange }) {
  return (
    <div className="screen-tabs-wrap">
      <div className="screen-tabs" role="tablist" aria-label="Pantallas del prototipo">
        <div className="prototype-mark"><Sparkles size={14} /> Prototipo</div>
        {SCREENS.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={active === id}
            className={active === id ? "active" : ""}
            onClick={() => onChange(id)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}


/**
 * La conversacion que se ve en el celular, mensaje por mensaje.
 *
 * POR QUE UN CHAT Y NO UNA PANTALLA DE PRODUCTO. Antes esta seccion mostraba un panel de aplicacion
 * con tarjetas y tablas: era bonito y contaba la historia equivocada. El canal es WhatsApp y eso es
 * lo que la gente ya tiene en la cabeza, asi que ver una interfaz de escritorio obliga a traducir
 * mentalmente ("¿entonces tengo que entrar a una pagina?"). Un hilo de mensajes no hay que
 * explicarlo.
 *
 * `paso` amarra cada mensaje al capitulo del scroll que ya existia, asi que el texto de la izquierda
 * y la conversacion avanzan juntos y no hay dos fuentes de verdad sobre en que punto va la historia.
 *
 * `mio` es el mensaje del usuario. Van pocos y cortos a proposito: la promesa es que casi no hay que
 * hacer nada, y un hilo donde el usuario escribe parrafos la contradice.
 */
const CHAT = [
  { paso: 0, texto: "Hola 👋 Soy Clara. ¿Miramos tu declaración de renta?" },
  { paso: 0, mio: true, texto: "hola, sí" },
  { paso: 0, texto: "Ya consulté lo que la DIAN tiene a tu nombre. No tienes que buscar nada." },
  {
    paso: 0,
    tarjeta: { titulo: "Lo que reportaron a tu nombre", filas: [["Certificados", "5"], ["Ingresos", "$96.718.600"]] },
  },
  { paso: 1, texto: "Revisé 3 oportunidades de ahorro. Dos tienen soporte, así que las apliqué." },
  {
    paso: 1,
    tarjeta: {
      titulo: "Lo que encontré",
      filas: [["Retenciones", "−$450.000"], ["Aporte AFC", "−$840.000"], ["Dependiente", "sin soporte"]],
    },
  },
  { paso: 1, texto: "La del dependiente la dejé por fuera: sin el registro civil no la podríamos defender ante la DIAN." },
  { paso: 2, mio: true, texto: "y el formulario?" },
  { paso: 2, texto: "Ya lo llené. Cada valor en su casilla del 210, listo para que lo revises." },
  { paso: 2, texto: "La firma y la presentación siempre las haces tú 🔒" },
  { paso: 3, texto: "Según la DIAN pagarías $2.480.000. Con lo que encontré, quedas en $1.190.000." },
  {
    paso: 3,
    tarjeta: { titulo: "Te ahorras", monto: "$1.290.000", pie: "Cada peso con su explicación y su soporte" },
  },
  { paso: 3, mio: true, texto: "listo, lo reviso 🙌" },
];

function MagicStory() {
  const [activeStep, setActiveStep] = useState(0);
  const storyRef = useRef(null);
  const steps = [
    {
      number: "01",
      eyebrow: "PRIMERO, LO QUE YA EXISTE",
      title: "Reunimos lo que la DIAN sabe de ti",
      copy: "Clara encuentra tus certificados, ingresos y retenciones. Tú no tienes que buscar archivos ni copiar cifras.",
    },
    {
      number: "02",
      eyebrow: "DESPUÉS, LO QUE PUEDE MEJORAR",
      title: "Revisamos cada oportunidad, con soporte",
      copy: "Probamos las deducciones que sí te aplican y descartamos las que podrían exponerte a una sanción.",
    },
    {
      number: "03",
      eyebrow: "LUEGO, EL TRABAJO PESADO",
      title: "Diligenciamos los formularios por ti",
      copy: "Llevamos cada valor a la casilla correcta y dejamos el borrador listo en el portal de la DIAN. Tú no copias cifras ni haces cálculos.",
    },
    {
      number: "04",
      eyebrow: "ANTES DE QUE PAGUES",
      title: "Te mostramos el resultado completo",
      copy: "Ves de dónde sale cada peso y cuánto logramos ahorrarte. Después revisas el borrador y decides si quieres continuar.",
    },
  ];

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const chapters = storyRef.current?.querySelectorAll(".magic-chapter");
      if (!chapters?.length) return;
      // Donde se considera que el lector esta mirando. En pantalla ancha es el centro. En telefono
      // es la franja alta, porque el aparato va pegado ABAJO y el texto pasa por encima: con el
      // punto en la zona baja (que es donde estaba cuando el aparato iba arriba) el capitulo que se
      // marcaba activo era el que quedaba tapado por el aparato.
      const FOCO = window.innerWidth < 760 ? 0.34 : 0.5;
      const focus = window.innerHeight * FOCO;
      let closest = 0;
      let distance = Infinity;
      chapters.forEach((chapter, index) => {
        const rect = chapter.getBoundingClientRect();
        const nextDistance = Math.abs(rect.top + rect.height / 2 - focus);
        if (nextDistance < distance) {
          distance = nextDistance;
          closest = index;
        }
      });
      setActiveStep(closest);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section className="magic" ref={storyRef}>
      <div className="magic-glow" />
      <div className="container magic-story">
        <div className="magic-copy">
          <div className="magic-heading">
            <div className="eyebrow light">LO QUE NADIE MÁS TE MUESTRA</div>
            <h2>De los datos de la DIAN a una declaración lista para presentar</h2>
          </div>
          {steps.map((step, index) => (
            <article className={`magic-chapter ${activeStep === index ? "active" : ""}`} key={step.number}>
              <span className="magic-number">{step.number}</span>
              <div>
                <small>{step.eyebrow}</small>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </div>
            </article>
          ))}
          <p className="magic-payment-note"><LockKeyhole size={14} /> Gratis hasta aquí. Solo pagas cuando decides presentarla.</p>
        </div>

        <div className="magic-visual-column">
          <Telefono paso={activeStep} />
        </div>
      </div>
    </section>
  );
}

/**
 * El celular con la conversacion, que avanza con el scroll.
 *
 * EL HILO SE ACUMULA, NO SE REEMPLAZA. Los mensajes de los capitulos anteriores se quedan y el hilo
 * sube: es como se lee un chat de verdad, y ademas deja ver lo que ya paso. La version de paneles
 * que habia antes cambiaba la pantalla entera en cada capitulo, asi que lo anterior desaparecia.
 *
 * SE MUEVE CON `transform` Y NO CON `scrollTop`. Un scroll programatico dentro de un elemento que
 * ya se esta moviendo con el scroll de la pagina pelea con el del usuario en movil y da saltos. Con
 * una traslacion, el navegador la compone en el hilo grafico y no hay conflicto.
 */
function Telefono({ paso }) {
  const hiloRef = useRef(null);
  const [desplazamiento, setDesplazamiento] = useState(0);

  // Cuanto hay que subir el hilo para que el ultimo mensaje visible quede al fondo de la pantalla.
  useEffect(() => {
    const hilo = hiloRef.current;
    if (!hilo) return;
    const medir = () => {
      const visibles = hilo.querySelectorAll(".chat-msg:not(.oculto)");
      const ultimo = visibles[visibles.length - 1];
      if (!ultimo) return setDesplazamiento(0);
      const alto = hilo.parentElement?.clientHeight ?? 0;
      const fin = ultimo.offsetTop + ultimo.offsetHeight;
      setDesplazamiento(Math.max(0, fin - alto + 16));
    };
    // Dos cuadros: el primero deja al navegador aplicar la clase, el segundo mide ya con el
    // mensaje nuevo ocupando su alto real.
    const id = requestAnimationFrame(() => requestAnimationFrame(medir));
    return () => cancelAnimationFrame(id);
  }, [paso]);

  return (
    <div className="fono" aria-label="Conversación con Clara por WhatsApp">
      <div className="fono-marco">
        <div className="fono-isla" />
        <header className="chat-top">
          <span className="chat-avatar">
            <Sparkles size={15} />
          </span>
          <div>
            <b>Clara</b>
            <small>en línea</small>
          </div>
          <span className="chat-canal">WhatsApp</span>
        </header>

        <div className="chat-hilo-marco">
          <div
            className="chat-hilo"
            ref={hiloRef}
            style={{ transform: `translateY(-${desplazamiento}px)` }}
          >
            {CHAT.map((m, i) => (
              <div
                key={i}
                className={[
                  "chat-msg",
                  m.mio ? "mio" : "suyo",
                  m.paso > paso ? "oculto" : "",
                ].join(" ")}
              >
                {m.tarjeta ? (
                  <div className="chat-tarjeta">
                    <small>{m.tarjeta.titulo}</small>
                    {m.tarjeta.monto ? (
                      <strong className="chat-tarjeta-monto money">{m.tarjeta.monto}</strong>
                    ) : null}
                    {m.tarjeta.filas?.map(([k, v]) => (
                      <span key={k}>
                        <i>{k}</i>
                        <b className="money">{v}</b>
                      </span>
                    ))}
                    {m.tarjeta.pie ? <em>{m.tarjeta.pie}</em> : null}
                  </div>
                ) : (
                  <p>{m.texto}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="chat-barra">
          <span>Escribe un mensaje</span>
          <i />
        </div>
      </div>
    </div>
  );
}

/**
 * El hero.
 *
 * ANTES ERA UNA FOTO DE UN PORTATIL, y era el problema: el mensaje entero del producto es "todo por
 * WhatsApp" y la primera imagen que veia alguien era una pantalla de escritorio. La foto estaba
 * bonita y contaba la historia de otro producto.
 *
 * Ahora el protagonista es el telefono con la conversacion, que es el canal. El asset ya existia
 * (`clara-phone-cutout`) y estaba enterrado en una seccion de mas abajo; trae encima las etiquetas
 * de "5 certificados encontrados" y "ahorro estimado", que es justo lo que hay que reforzar.
 *
 * LA FOTO SE QUEDA COMO AMBIENTE, DESPLAZADA. El paisaje al atardecer es lo que le da calidez al
 * sitio, asi que no se bota: se corre el encuadre (`object-position`) para que el portatil quede
 * fuera y solo entren montanas, niebla y la planta. Asi no hay dos aparatos compitiendo.
 *
 * DOS COLUMNAS, Y ESO RESUELVE OTRA COSA: con el copy centrado encima de la foto, el subtitulo y los
 * ganchos aterrizaban sobre la pantalla del portatil y se volvian ilegibles. Con el texto a un lado
 * y el telefono al otro, cada uno tiene su sitio.
 */

function ClaraWorkspace({ start }) {
  return (
    <div className="workspace-scene" aria-label="Clara preparando una declaración por WhatsApp">
      {/* Del fondo solo queda el horizonte. La toma completa tenía un portátil, formularios
          impresos y una carpeta rotulada "Declaración de renta 2024": tres cosas que niegan el
          mensaje justo detrás del titular que lo afirma. La banda de montañas no dice nada que
          haya que desmentir, y bajó de 2,2 MB a 37 KB, que en móvil se nota. */}
      <div className="workspace-camera">
        <img
          className="workspace-photo"
          src={heroHorizonte}
          alt="Amanecer sobre las montañas de Colombia"
          width="1600"
          height="351"
          fetchPriority="high"
        />
      </div>
      <div className="workspace-vignette" />

      <div className="hero-dos">
        <div className="workspace-copy">
          {/* ═══ EL HERO TENIA OCHO BLOQUES APILADOS ═══
              Antifaz, titular, parrafo, dos chips, boton, "mira como funciona", la segunda
              puerta y la calculadora de vencimiento. Cada uno se defendia solo y juntos no
              dejaban ver el titular. Se fue todo lo que repetia algo que ya estaba dicho:

              - "TODO POR WHATSAPP" lo dice el boton, que dice WhatsApp.
              - "Todo pasa en el chat" es lo mismo otra vez, ahora en forma de chip.
              - "Mira como funciona" apunta a una seccion que esta justo debajo: quien baja la
                encuentra sola, y quien no baja tampoco iba a tocar el enlace.
              - La calculadora de vencimiento contesta OTRA pregunta ("¿cuando?") en el sitio
                donde se decide la primera ("¿esto es para mi?"). Sigue viva en la guia, que es
                donde llega quien la busca. */}
          <h1>
            Tu declaración de renta{" "}
            <br />
            por <em>{pesos(PRECIO.AHORA)}</em>
          </h1>
          {/* El ancla va PEGADA al precio del titular, no despues del parrafo: "antes $150.000"
              solo cuenta la historia si se lee junto al $50.000 grande. */}
          <Promo clara ancla />
          <p>
            Le escribes a Clara por WhatsApp, contestas unas preguntas y ella deja el formulario
            de la DIAN listo para que lo revises y firmes.
          </p>
          <div className="workspace-actions">
            <Button onClick={start}>
              <MessageCircle size={18} /> Toca aquí y empieza tu declaración por WhatsApp
            </Button>
          </div>
          <p className="hero-gratis">Gratis hasta que veas tu resultado.</p>

          {/* LA SEGUNDA PUERTA ES UN BOTON, NO UNA FRASE CON UN ENLACE ADENTRO. Decia "¿No sabes
              si te toca declarar? Te lo decimos gratis en un minuto" con el subrayado en la
              segunda mitad, y habia que adivinar que esa parte se tocaba. Ahora la accion se ve
              y se nombra. */}
          <a className="hero-segunda-puerta" href="#consulta">
            <span>¿No sabes si te toca declarar?</span>
            <b>Toca aquí y te lo decimos gratis <ArrowRight size={15} /></b>
          </a>
        </div>

        <div className="hero-fono">
          <picture>
            <source srcSet={phoneArtworkWebp} type="image/webp" />
            <img
              src={phoneArtwork}
              alt="Conversación con Clara por WhatsApp donde encuentra 5 certificados y un ahorro estimado de $1.290.000"
              width="776"
              height="1000"
              fetchPriority="high"
              decoding="async"
            />
          </picture>
        </div>
      </div>

      <div className="scroll-cue">
        <span>Desliza para entrar</span>
        <div />
      </div>
    </div>
  );
}

/**
 * El hero de la landing de intencion baja (/te-toca-declarar).
 *
 * ═══ POR QUE EXISTE UNA SEGUNDA LANDING ═══
 *
 * Las busquedas que pagan los anuncios son de dos familias distintas. "declarar renta online" es
 * alguien decidido: a ese le sirve el hero clasico, que vende el servicio. Pero "quien debe
 * declarar renta" o "topes para declarar" es alguien con una PREGUNTA, y aterrizarlo en un hero
 * que vende es contestarle otra cosa: por eso el 80% se iba sin tocar nada. Aca la respuesta a su
 * pregunta es lo primero que ve, y el producto aparece despues, cuando el veredicto lo vuelve
 * relevante.
 *
 * La consulta es el MISMO componente de la portada: un solo flujo que mantener, dos puertas.
 */
function HeroConsulta() {
  return (
    <section id="consulta" className="hero-consulta">
      {/* El mismo amanecer del hero principal: las dos puertas son la misma marca, y el color
          plano se leia como una pagina de relleno. El velo oscurece hacia abajo para que la
          foto no compita con las cifras de la tarjeta. */}
      <div className="hero-consulta-fondo" aria-hidden="true">
        <img src={heroHorizonte} alt="" width="1600" height="351" fetchPriority="high" decoding="async" />
        <div className="hero-consulta-velo" />
      </div>
      <div className="container hero-consulta-dos">
        <div className="hero-consulta-copy">
          <h1>
            ¿Te toca declarar renta <em>este año?</em>
          </h1>
          <p>
            Averígualo aquí mismo, sin escribirle a nadie. Y si te toca, te decimos tu fecha
            límite y Clara te deja la declaración lista por WhatsApp.
          </p>
          <ul className="hero-consulta-senas">
            <li><Check size={15} /> Dos toques, sin datos ni claves</li>
            <li><ShieldCheck size={15} /> O con tu clave de la DIAN, con tus cifras reales</li>
            <li><MessageCircle size={15} /> Si te toca, la hacemos hoy por WhatsApp</li>
          </ul>
        </div>
        <div className="hero-consulta-caja">
          {/* SIN DESCUENTO EN ESTE HERO, y es deliberado: quien llega aqui viene con una
              pregunta, no a comprar, y ponerle el precio antes de su respuesta es contestarle
              otra cosa. La oferta aparece donde si corresponde: en el veredicto, justo cuando
              se entera de que le toca, y en la seccion de precio de abajo. */}
          {/* EL FLUJO CORTO SOLO EN ESTA LANDING, y la portada sigue con el largo: son dos
              intenciones distintas y conviene poder comparar los dos embudos con trafico real
              antes de cambiar el de todos. El atajo para el comprador decidido ya viene dentro
              de `ConsultaRapida`, asi que aca no se repite. */}
          <ConsultaRapida />
        </div>
      </div>
    </section>
  );
}

export const FAQS_PORTADA = [
  ["¿Es seguro darle mi clave de la DIAN?", "Sí. La conexión va cifrada, tu clave nunca pasa por WhatsApp y puedes pedir que la borremos al terminar."],
  ["¿Clara presenta por mí?", "No. Clara prepara todo, pero la firma y la presentación siempre las haces tú."],
  ["¿Qué pasa si no estoy obligado a declarar?", "Te lo decimos gratis y te damos una constancia que puedes usar con tu banco."],
  ["¿Y si ya tengo contador?", "Puedes usar Clara para comparar, organizar tus soportes o llegar a tu contador con un borrador claro."],
  ["¿Cuánto cuesta y qué incluye?", "$50.000, un solo pago, sea que seas asalariado o independiente. Incluye la consulta de tu información, la búsqueda de ahorros con soporte y el formulario diligenciado. Solo pagas si decides presentar."],
  ["¿Todo se hace por WhatsApp?", "Sí. Contestas por chat y ahí mismo recibes tu resultado. Solo se abre una página segura para dos cosas: escribir tu clave de la DIAN y pagar. Nunca vas a tener que crear un usuario ni recordar otra contraseña."],
  ["¿Qué pasa si la DIAN me hace un requerimiento?", "Te ayudamos a entenderlo. Si ocurrió por un error nuestro, la corrección va por nuestra cuenta."],
  ];

function Landing({ goTo }) {
  const [faqOpen, setFaqOpen] = useState(0);
  const [headerSolid, setHeaderSolid] = useState(false);
  const heroRef = useRef(null);

  // DOS LANDINGS, UNA PAGINA. La ruta decide el hero: /te-toca-declarar abre con la consulta
  // (intencion baja: alguien con una pregunta) y / con el producto (intencion alta: alguien
  // decidido). Todo lo demas es identico, porque la historia que sigue es la misma.
  const baja = useLocation().pathname === "/te-toca-declarar";

  const start = () => goTo("whatsapp");
  useEffect(() => {
    let frame = 0;
    const updateStory = () => {
      frame = 0;
      const hero = heroRef.current;
      if (!hero) return;
      const range = Math.max(hero.offsetHeight - window.innerHeight, 1);
      const progress = Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / range));
      hero.style.setProperty("--story", progress.toFixed(4));
      hero.closest(".landing")?.style.setProperty("--hero-progress", progress.toFixed(4));
      setHeaderSolid(progress > 0.94);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(updateStory);
    };
    updateStory();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  // Las preguntas de la portada ya estan escritas para una persona, asi que sirven tal cual como
  // datos estructurados. Marcadas, un buscador las puede mostrar desplegadas en el resultado.
  const datos = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITIO}/#preguntas`,
    mainEntity: FAQS_PORTADA.map(([pregunta, respuesta]) => ({
      "@type": "Question",
      name: pregunta,
      acceptedAnswer: { "@type": "Answer", text: respuesta },
    })),
  };

  return (
    <div className="landing">
      <Seo
        titulo={PAGINAS[baja ? "/te-toca-declarar" : "/"].titulo}
        descripcion={PAGINAS[baja ? "/te-toca-declarar" : "/"].descripcion}
        ruta={baja ? "/te-toca-declarar" : "/"}
        datos={baja ? null : datos}
      />
      {/* En la variante de consulta la cabecera va opaca desde el principio: no hay foto del
          hero que pida transparencia, y su CTA lleva a la consulta que esta ahi mismo. */}
      {/* El boton de la cabecera habla el idioma de cada landing: en la de consulta invita a
          averiguar; en la de compra, "Averigua gratis" era mandar al comprador a otra puerta. */}
      <Cabecera
        solida={baja || headerSolid}
        alCta={baja ? irAlaConsulta : start}
        ctaTexto={baja ? "Averigua gratis" : "Empieza ya"}
      />

      <main>
        {baja ? (
          <HeroConsulta />
        ) : (
          <section className="hero-story" ref={heroRef}>
            <div className="hero-sticky">
              <ClaraWorkspace start={start} />
            </div>
          </section>
        )}

        <section className="section problem">
          <div className="container">
            {/* El titular enmarca la comparación con Clara primero. Antes decía "hoy declarar renta es un
                dolor de cabeza", que presenta el problema de otro producto justo cuando la primera
                columna que se lee es la solución. */}
            <div className="section-heading">
              <div className="eyebrow">MENOS PLATA, MENOS VUELTAS</div>
              <h2>Lo mismo, por menos de una tercera parte y sin salir de WhatsApp</h2>
            </div>
            {/* Clara va PRIMERO. En una comparación, lo que se lee primero es lo que se recuerda,
                y el orden inverso hacía que el visitante entrara por el problema de otro producto.
                Las dos primeras filas son el precio y el canal porque son las dos preguntas que
                alguien trae antes de leer nada más. */}
            <div className="comparison-grid">
              <CompareCard
                good
                metric="$50.000"
                metricLabel="pago único"
                title="Con Clara"
                canal="Todo por WhatsApp"
                items={[
                  "Contestas por chat, sin crear cuentas ni recordar contraseñas",
                  "Recibes el formulario diligenciado para revisarlo",
                  "Cada ahorro incluye su explicación y su soporte",
                ]}
              />
              <CompareCard
                metric="$170.000"
                metricLabel="en adelante"
                title="Con las otras opciones"
                canal="Página web, correos y llamadas"
                items={[
                  "Creas usuario y contraseña, y llenas formularios largos",
                  "Terminas copiando datos y valores en el portal de la DIAN",
                  "Es difícil saber qué cambió y por qué",
                ]}
              />
            </div>
          </div>
        </section>

        <section id="como" className="section steps-section">
          <div className="container">
            <div className="process-intro"><div><div className="eyebrow">ASÍ DE SIMPLE</div><h2>De “no sé por dónde empezar” a “ya quedó”.</h2></div><p>Todo pasa en el chat de WhatsApp. Clara hace el trabajo pesado detrás; tú solo respondes, revisas y firmas.</p></div>
            <div className="process-showcase">
              <div className="process-chapters">
                {[
                  ["01", "Hablas por WhatsApp, no llenas formularios", "Clara pregunta una cosa a la vez, por chat. En 30 segundos sabe si podrías estar obligado a declarar."],
                  ["02", "Cruza lo que la DIAN sabe", "Trae ingresos, retenciones y certificados. Después busca beneficios que estén realmente soportados."],
                  ["03", "Te muestra cada peso", "Ves cuánto pagarías, cuánto ahorras y de dónde salió cada valor antes de pagar."],
                ].map(([number, title, copy]) => (
                  <article className="process-chapter" key={number}>
                    <span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div><ArrowRight size={20} />
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <MagicStory />

        <section className="section honest">
          <div className="container">
            <div className="honest-layout">
              <div className="honest-intro">
                <div className="eyebrow">OPTIMIZACIÓN HONESTA</div>
                <h2>Te ayudamos a pagar menos, sin pasarte el riesgo</h2>
                <p>Cada beneficio pasa por tres filtros antes de entrar a tu declaración. Si está soportado, lo aplicamos. Si falta algo, te lo pedimos. Si no es defendible ante la DIAN, lo descartamos.</p>
                <div className="honest-proof"><strong>3</strong><span>filtros antes de modificar tu declaración</span></div>
              </div>
              <div className="traffic-grid">
                <TrafficCard color="green" metric="Aplicar" status="Soporte confirmado" title="Lo que sí es tuyo">Beneficios con respaldo real. Los incluimos y te mostramos su efecto.</TrafficCard>
                <TrafficCard color="amber" metric="Validar" status="Lo resolvemos contigo" title="Lo que necesita soporte">Es legal y te conviene, pero falta un documento. Te explicamos exactamente cuál.</TrafficCard>
                <TrafficCard color="red" metric="Descartar" status="Sin respaldo suficiente" title="Lo que no hacemos">No usamos beneficios que no podríamos defender ante la DIAN.</TrafficCard>
              </div>
            </div>
            <div className="quote-card">
              <Avatar />
              <div><span className="quote-label">CLARA TE LO DIRÍA ASÍ</span><blockquote>“Esta deducción bajaría tu impuesto en $980.000, pero no encontramos soportes suficientes para aplicarla. Por eso la dejamos por fuera: si la DIAN la rechaza, pagarías el impuesto pendiente, sanciones e intereses.”</blockquote></div>
              <div className="risk-compare"><span>Ahorro aparente <b className="money">$980.000</b></span><i /><span>Riesgo real <b className="money">$2.000.000+</b></span></div>
            </div>
          </div>
        </section>

        <section className="credibility">
          <div className="container credibility-editorial">
            <div className="credibility-copy">
              <div className="eyebrow">CON RESPALDO, SIN LETRA PEQUEÑA</div>
              <h2>
                Automática,{" "}
                <br />
                <em>pero nunca a ciegas.</em>
              </h2>
              <p>Clara deja un registro de cada dato encontrado, cada beneficio aplicado y cada revisión realizada.</p>
              <div className="credibility-metric"><strong>Cada peso</strong><span>del ahorro queda explicado</span></div>
            </div>
            <div className="audit-card">
              <div className="audit-top"><div><Sparkles size={18} /><span>Trazabilidad de tu declaración</span></div><small><i /> Actualizado ahora</small></div>
              <div className="audit-saving"><span>Decisiones explicadas</span><strong>3 de 3</strong></div>
              <div className="audit-events">
                <article><time>09:41</time><FileCheck2 size={19} /><div><strong>Información de la DIAN importada</strong><p>5 certificados verificados</p></div><Check size={16} /></article>
                <article><time>09:42</time><CircleDollarSign size={19} /><div><strong>Beneficio AFC aplicado</strong><p>Reducción respaldada por $840.000</p></div><Check size={16} /></article>
                <article><time>09:43</time><BadgeCheck size={19} /><div><strong>Revisión contable completada</strong><p>Sin inconsistencias encontradas</p></div><Check size={16} /></article>
              </div>
              <div className="audit-footer"><ShieldCheck size={17} /><span><b>Tú tienes la última palabra</b>Revisas el borrador antes de firmar.</span></div>
            </div>
          </div>
        </section>

        {/* LA SEGUNDA PUERTA, ANTES DEL PRECIO. Quien todavia duda si le toca declarar no esta
            listo para leer cuanto cuesta: primero necesita saber si esto es para el. Y va aqui y no
            arriba porque el hero le pertenece a quien ya sabe que le toca. En la landing de
            consulta NO se repite: alla la consulta ya es el hero. */}
        {baja ? null : (
          <section id="consulta" className="section consulta-seccion">
            <div className="container">
              <div className="section-heading">
                <div className="eyebrow">GRATIS Y EN UN MINUTO</div>
                <h2>¿No sabes si te toca declarar?</h2>
                <p>
                  Es la pregunta que más nos hacen. Contéstala acá sin escribirle a nadie: son cinco
                  preguntas y casi siempre termina en la primera.
                </p>
              </div>
              <Consulta />
            </div>
          </section>
        )}

        <section id="precio" className="section pricing">
          <div className="container">
            <div className="section-heading">
              <div className="eyebrow">PRECIO CLARO</div>
              <h2>Hoy $50.000. Un solo pago, sin sorpresas</h2>
            </div>
            <div className="pricing-grid pricing-unico">
              <PriceCard
                featured
                title="Tu declaración de renta"
                extra="Asalariado, independiente, con arriendos o dividendos. El mismo precio."
                onClick={start}
              />
            </div>
            <p className="price-note">
              <CheckCircle2 size={18} /> Todo se hace por WhatsApp y solo pagas cuando ves tu
              resultado. Si no estás obligado a declarar, te lo decimos gratis.
            </p>
          </div>
        </section>

        <section id="seguridad" className="section security">
          <div className="container security-grid">
            <div>
              <div className="eyebrow">SEGURIDAD</div>
              <h2>Tu clave de la DIAN está segura</h2>
              <p className="security-intro">Diseñamos cada paso para que tú mantengas el control de tus datos y de tu declaración.</p>
              <div className="security-seal"><span /><span /><LockKeyhole size={34} /><small>CONEXIÓN CIFRADA</small></div>
            </div>
            <div className="security-console">
              <div className="security-console-top"><span>Ruta protegida de tus datos</span><small><i /> Conexión activa</small></div>
              <div className="security-route">
                <div className="route-node"><MessageCircle size={22} /><span>WhatsApp</span><small>Solo conversas</small></div>
                <div className="route-line"><i /><LockKeyhole size={18} /><span /></div>
                <div className="route-node protected"><ShieldCheck size={22} /><span>Conexión segura</span><small>Canal cifrado separado</small></div>
                <div className="route-line"><i /><LockKeyhole size={18} /><span /></div>
                <div className="route-node"><FileCheck2 size={22} /><span>Portal DIAN</span><small>Consulta autorizada</small></div>
              </div>
              <div className="security-controls">
                <article><CheckCircle2 size={18} /><div><strong>No queda en el chat</strong><p>Tu clave viaja por una conexión separada.</p></div></article>
                <article><CheckCircle2 size={18} /><div><strong>Uso limitado</strong><p>Solo se usa para preparar tu declaración.</p></div></article>
                <article><CheckCircle2 size={18} /><div><strong>Borrado cuando quieras</strong><p>Puedes pedir que la eliminemos al terminar.</p></div></article>
                <article><CheckCircle2 size={18} /><div><strong>Acceso revocable</strong><p>Puedes desconectar a Clara cuando quieras.</p></div></article>
              </div>
            </div>
          </div>
        </section>

        <section className="section faq">
          <div className="container faq-grid">
            <div className="faq-aside">
              <div className="eyebrow">PREGUNTAS FRECUENTES</div><h2>Todo claro antes de empezar</h2>
              <div className="faq-help"><MessageCircle size={20} /><div><strong>¿Te quedó otra duda?</strong><p>Pregúntale directamente a Clara por WhatsApp.</p></div><ArrowRight size={18} /></div>
            </div>
            <div className="accordion">
              {FAQS_PORTADA.map(([q, a], i) => (
                <button className={`faq-item ${faqOpen === i ? "open" : ""}`} key={q} onClick={() => setFaqOpen(faqOpen === i ? -1 : i)}>
                  <small>0{i + 1}</small><span>{q}</span><ChevronDown size={20} />
                  <p>{a}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="section guias" id="guias">
          <div className="container">
            <div className="guias-cabeza">
              <div className="eyebrow">RESUELVE TU DUDA PRIMERO</div>
              <h2>Guías de renta, escritas en pesos y sin jerga</h2>
              <p>
                Si prefieres entender antes de empezar, acá está todo explicado. Los topes en pesos y
                no en UVT, tu fecha límite según la cédula y cuánto baja el impuesto de verdad.
              </p>
            </div>
            <div className="guias-grid">
              {Object.values(RACIMO).map(([ruta, titulo, resumen]) => (
                <a className="guia-tarjeta" href={ruta} key={ruta}>
                  <h3>{titulo}</h3>
                  <p>{resumen}</p>
                  <span>
                    Leer <ArrowRight size={16} />
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="section final-cta">
          <div className="cta-glow" />
          <div className="cta-orbit orbit-a" /><div className="cta-orbit orbit-b" />
          <div className="container final-cta-grid">
            <div className="final-cta-copy">
              <div className="eyebrow light">TU DECLARACIÓN EMPIEZA AQUÍ</div>
              <h2>
                Escribe por WhatsApp.{" "}
                <br />
                <em>En 30 segundos sabes.</em>
              </h2>
              <p>Te decimos gratis si estás obligado a declarar. Si continúas, tu declaración queda lista en cerca de 15 minutos por $50.000, sin salir del chat.</p>
              <div className="cta-trust"><span><MessageCircle size={14} /> Todo por WhatsApp</span><span><CircleDollarSign size={14} /> $50.000, un solo pago</span><span><LockKeyhole size={14} /> Datos cifrados</span></div>
            </div>
            <div className="cta-live-card">
              <div className="cta-chat-head"><Avatar /><div><strong>Clara</strong><span>en línea ahora</span></div><i /></div>
              <div className="cta-bubble">Hola. En 30 segundos te digo gratis si debes declarar este año.</div>
              <div className="cta-result"><span>Consulta inicial</span><strong className="money">$0</strong></div>
              <div className="cta-result"><span>Si decides presentar</span><strong className="money"><s>$150.000</s> $50.000</strong></div>
              <Button onClick={start}>Escribirle a Clara <ArrowRight size={18} /></Button>
              <small>No necesitas tarjeta para empezar</small>
            </div>
          </div>
        </section>
      </main>
      <Pie alCta={start} />
    </div>
  );
}

/**
 * Una columna de la comparación.
 *
 * `canal` va SEPARADO de `items` y no como un bullet más: es la diferencia que la gente entiende
 * sin explicación ("por WhatsApp" contra "otra página en la que registrarse") y en una lista de
 * tres viñetas se perdía entre las otras dos.
 */
function CompareCard({ title, items, metric, metricLabel, canal, good = false }) {
  return (
    <article className={`compare-card ${good ? "good" : ""}`}>
      <div className="compare-top"><div className="compare-icon">{good ? <Sparkles size={22} /> : <HelpCircle size={22} />}</div><div className="compare-metric"><strong>{metric}</strong><span>{metricLabel}</span></div></div>
      <h3>{title}</h3>
      {canal ? (
        <p className="compare-canal">
          {good ? <MessageCircle size={16} /> : <Globe size={16} />}
          {canal}
        </p>
      ) : null}
      <ul>{items.map((item) => <li key={item}>{good ? <Check size={18} /> : <span>×</span>} {item}</li>)}</ul>
    </article>
  );
}

function TrafficCard({ color, metric, status, title, children }) {
  return (
    <article className={`traffic-card traffic-${color}`}>
      <div className="traffic-card-top">
        <div className={`signal ${color}`} />
        <strong className="traffic-metric">{metric}</strong>
        <span className="traffic-status">{status}</span>
      </div>
      <div className="traffic-card-copy"><h3>{title}</h3><p>{children}</p></div>
      <ArrowRight size={19} />
    </article>
  );
}

/**
 * El precio, en una sola tarjeta ancha.
 *
 * ERA DOS PLANES ($59.900 asalariado y $79.900 independiente) Y AHORA ES UNO. Con el titular
 * diciendo $50.000, dos precios distintos mas abajo se leen como una contradiccion, y una
 * contradiccion en el precio es lo que hace que alguien cierre la pagina.
 *
 * El badge "mas completo" tambien se fue: sin un segundo plan al lado no hay con que comparar, asi
 * que solo generaba la duda de cual es el otro. Y la forma pasa a ser horizontal (precio a un lado,
 * lo que incluye al otro) porque una tarjeta sola en una rejilla de dos columnas quedaba en trescientos
 * pixeles de ancho, con cada linea de la lista partida en tres.
 */
function PriceCard({ title, extra, onClick }) {
  const items = [
    "Consultamos tu información en la DIAN",
    "Buscamos los ahorros que tengan soporte",
    "Diligenciamos el formulario 210 completo",
    "Organizamos tu carpeta de soportes",
    "Garantía: si erramos, la corrección va por nuestra cuenta",
  ];
  return (
    <article className="price-card price-card-ancha">
      <div className="price-lado">
        <h3>{title}</h3>
        <div className="price money">
          <s className="price-antes money">{pesos(PRECIO.LISTA)}</s>
          {pesos(PRECIO.AHORA)}
        </div>
        <span className="once">pago único, por WhatsApp</span>
        <Promo soloReloj />
        {extra ? <p className="price-extra">{extra}</p> : null}
        <Button onClick={onClick}>
          Empieza gratis por WhatsApp <ArrowRight size={17} />
        </Button>
      </div>
      <ul>
        {items.map((item) => (
          <li key={item}>
            <Check size={17} />
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}

/**
 * El prototipo esta encendido en desarrollo, y en produccion solo con ?prototipo=1.
 *
 * Se calcula una vez y fuera del componente porque no cambia durante la visita, y porque asi el
 * `import()` de las pantallas ni siquiera se evalua cuando esta apagado.
 */
const CON_PROTOTIPO =
  import.meta.env.DEV ||
  (typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("prototipo"));

const Pantallas = CON_PROTOTIPO ? lazy(() => import("./prototipo/Pantallas")) : null;

/**
 * Abre la conversacion real. En el prototipo, en cambio, se salta a la pantalla de la maqueta.
 *
 * EL MENSAJE DEPENDE DE QUIEN LLEGA. "Quiero hacer mi declaracion" y "quiero saber si me toca"
 * son dos conversaciones distintas, y el primer mensaje es lo unico que el canal sabe del
 * contexto. El parametro se valida porque la mitad de los botones llaman esto con el evento del
 * clic de primer argumento: solo una cadena cuenta como mensaje.
 */
export function abrirWhatsApp(mensaje) {
  const texto = typeof mensaje === "string" ? mensaje : MENSAJES.declarar;
  const numero = import.meta.env.VITE_WHATSAPP;
  if (!numero) {
    // Sin numero configurado el boton NO se queda muerto: lleva a la guia, que responde la misma
    // pregunta ("¿me toca declarar?") y tiene la calculadora de la fecha. Es un destino real
    // mientras el numero se configura, y el build avisa de que falta.
    //
    // SALVO QUE YA SE ESTE AHI, que es justo donde vive la calculadora. Mandar a alguien a la
    // pagina que esta leyendo es un clic que no hace nada: el boton dice "escribenos por WhatsApp"
    // y aparenta estar roto. Se manda a la portada, que es de donde sale la conversacion.
    const guia = "/declaracion-de-renta-2026";
    window.location.assign(window.location.pathname.startsWith(guia) ? "/" : guia);
    return;
  }
  // El aviso a Google va ANTES de abrir la pestaña. No porque se pueda perder —esta pagina sigue
  // viva— sino porque si `window.open` lo bloquea un navegador, el hecho igual ocurrio: la persona
  // hizo clic en el boton, y eso es lo que se esta midiendo.
  registrarAperturaDeChat();
  // El mismo hecho en PostHog, con el mensaje como propiedad: el embudo dependia del autocapture
  // adivinando cual boton era "el de WhatsApp", y el acto mas importante del sitio no puede
  // depender de una adivinanza.
  registrar("whatsapp_abierto", { mensaje: texto });

  // El rastro del anuncio viaja DENTRO del mensaje, no como parametro: wa.me lee `text` y descarta
  // todo lo demas. Quien llega por busqueda organica no lleva ninguno y el mensaje sale limpio.
  window.open(
    `https://wa.me/${numero}?text=${encodeURIComponent(texto + referenciaDeAnuncio())}`,
    "_blank",
    "noopener",
  );
}

/** Sube a la consulta del hero. Es el CTA de la cabecera en la landing de intencion baja. */
function irAlaConsulta() {
  document.getElementById("consulta")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function App() {
  const [screen, setScreen] = useState("landing");
  const goTo = (next) => {
    // Sin prototipo, todo lo que llevaba a una pantalla de maqueta abre la conversacion de verdad.
    if (!CON_PROTOTIPO) {
      abrirWhatsApp();
      return;
    }
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  useEffect(() => {
    // La portada NO reescribe el titulo: el suyo lo pone el componente de SEO y es el que compite
    // en el buscador. Las demas pantallas son del prototipo y no se indexan.
    if (screen === "landing") return;
    document.title = `Clara | ${SCREENS.find(([id]) => id === screen)?.[1]}`;
  }, [screen]);

  const Pantalla = CON_PROTOTIPO && screen !== "landing" ? screen : null;

  return (
    <>
      {CON_PROTOTIPO ? <ScreenTabs active={screen} onChange={goTo} /> : null}
      <div key={screen} className="screen-transition">
        {screen === "landing" ? <Landing goTo={goTo} /> : null}
        {Pantalla ? (
          <Suspense fallback={null}>
            <Pantallas nombre={Pantalla} goTo={goTo} />
          </Suspense>
        ) : null}
      </div>
    </>
  );
}
