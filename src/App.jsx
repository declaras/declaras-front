import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Eye,
  EyeOff,
  FileCheck2,
  HelpCircle,
  LockKeyhole,
  MessageCircle,
  Paperclip,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import heroWorkspace from "./assets/clara-hero-final.png";
import heroWorkspaceMobile from "./assets/clara-hero-mobile.png";
import phoneArtwork from "./assets/clara-phone-cutout.png";

const SCREENS = [
  ["landing", "Landing"],
  ["connection", "Conexión DIAN"],
  ["review", "Revisión"],
  ["optimization", "Optimización"],
  ["payment", "Pago"],
  ["whatsapp", "WhatsApp"],
];

const money = (value) => <span className="money">{value}</span>;

function Logo({ light = false }) {
  return (
    <button className={`logo ${light ? "logo-light" : ""}`} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
      <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
        <g stroke="currentColor" strokeWidth="3.3" strokeLinecap="round">
          <path d="M16 3.5v5" /><path d="M16 23.5v5" />
          <path d="M3.5 16h5" /><path d="M23.5 16h5" />
          <path d="m7.2 7.2 3.5 3.5" /><path d="m21.3 21.3 3.5 3.5" />
          <path d="m24.8 7.2-3.5 3.5" /><path d="m10.7 21.3-3.5 3.5" />
        </g>
      </svg>
      <span className="logo-word">Clara<span className="logo-dot">.</span></span>
    </button>
  );
}

function Avatar({ size = "md" }) {
  return (
    <div className={`avatar avatar-${size}`} aria-label="[IMAGEN: avatar de Clara]">
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <g stroke="currentColor" strokeWidth="3.3" strokeLinecap="round">
          <path d="M16 3.5v5" /><path d="M16 23.5v5" />
          <path d="M3.5 16h5" /><path d="M23.5 16h5" />
          <path d="m7.2 7.2 3.5 3.5" /><path d="m21.3 21.3 3.5 3.5" />
          <path d="m24.8 7.2-3.5 3.5" /><path d="m10.7 21.3-3.5 3.5" />
        </g>
      </svg>
      <span className="online-dot" />
    </div>
  );
}

function Button({ children, variant = "primary", className = "", onClick, type = "button" }) {
  return (
    <button type={type} className={`button button-${variant} ${className}`} onClick={onClick}>
      {children}
    </button>
  );
}

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

function SavingsCard({ compact = false }) {
  return (
    <div className={`savings-card ${compact ? "savings-compact" : ""}`}>
      <div className="savings-row">
        <span>Según la DIAN</span>
        <strong className={compact ? "" : "strike"}>{money("$2.480.000")}</strong>
      </div>
      <div className="savings-row">
        <span>Optimizada</span>
        <strong>{money("$1.190.000")}</strong>
      </div>
      <div className="savings-total">
        <span>Te ahorras</span>
        <strong>{money("$1.290.000")}</strong>
      </div>
    </div>
  );
}

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
      const focus = window.innerHeight * (window.innerWidth < 760 ? 0.72 : 0.5);
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
          <div className="magic-product">
            <div className="magic-product-top">
              <Logo light />
              <div><i /><span>Análisis en vivo</span></div>
              <small>{activeStep + 1} de 4</small>
            </div>
            <div className="magic-progress"><span style={{ width: `${((activeStep + 1) / 4) * 100}%` }} /></div>
            <div className="magic-screen">
              <div className={`magic-panel magic-source ${activeStep === 0 ? "active" : ""}`}>
                <div className="panel-kicker"><FileCheck2 size={17} /> Información encontrada</div>
                <h3>Esto reportaron a tu nombre</h3>
                <div className="source-summary">
                  <span><small>Certificados</small><strong>5</strong></span>
                  <span><small>Ingresos</small><strong className="money">$96.718.600</strong></span>
                </div>
                <div className="source-files">
                  <span><Check size={15} /> Certificado laboral <b>Listo</b></span>
                  <span><Check size={15} /> Retenciones en la fuente <b>Listo</b></span>
                  <span><Check size={15} /> Información bancaria <b>Listo</b></span>
                </div>
              </div>

              <div className={`magic-panel magic-opportunities ${activeStep === 1 ? "active" : ""}`}>
                <div className="panel-kicker"><Sparkles size={17} /> Optimización honesta</div>
                <h3>Revisamos 3 oportunidades</h3>
                <div className="opportunity-list">
                  <span className="approved"><CheckCircle2 size={19} /><i><b>Retenciones verificadas</b><small>Aplicadas automáticamente</small></i><strong className="money">-$450.000</strong></span>
                  <span className="approved"><CheckCircle2 size={19} /><i><b>Aporte AFC</b><small>Soporte encontrado</small></i><strong className="money">-$840.000</strong></span>
                  <span className="rejected"><ShieldCheck size={19} /><i><b>Dependiente</b><small>Sin soporte suficiente</small></i><strong>No aplicado</strong></span>
                </div>
              </div>

              <div className={`magic-panel magic-form ${activeStep === 2 ? "active" : ""}`}>
                <div className="panel-kicker"><FileCheck2 size={17} /> Borrador en preparación</div>
                <h3>Clara diligencia el formulario</h3>
                <div className="form-preview">
                  <div className="form-preview-top"><span>Formulario 210</span><b>DIAN</b></div>
                  <div className="form-field"><small>Casilla 33 · Ingresos brutos</small><strong className="money">$96.718.600</strong><Check size={14} /></div>
                  <div className="form-field"><small>Casilla 58 · Rentas exentas</small><strong className="money">$12.400.000</strong><Check size={14} /></div>
                  <div className="form-field"><small>Casilla 121 · Retenciones</small><strong className="money">$3.120.000</strong><Check size={14} /></div>
                  <div className="form-ready"><BadgeCheck size={18} /><span><b>Borrador diligenciado</b><small>Listo para que lo revises</small></span></div>
                </div>
                <p className="form-control-note"><LockKeyhole size={14} /> La firma y la presentación siempre las haces tú.</p>
              </div>

              <div className={`magic-panel magic-result ${activeStep === 3 ? "active" : ""}`}>
                <div className="panel-kicker"><BadgeCheck size={17} /> Resultado listo para revisar</div>
                <h3>Tu declaración, optimizada</h3>
                <div className="result-row"><span>Según la DIAN</span><strong className="strike money">$2.480.000</strong></div>
                <div className="result-row"><span>Después de optimizar</span><strong className="money">$1.190.000</strong></div>
                <div className="result-total"><span>Te ahorras</span><strong className="money">$1.290.000</strong></div>
                <div className="result-check"><Check size={16} /> Cada beneficio tiene respaldo</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ClaraWorkspace({ start }) {
  return (
    <div className="workspace-scene" aria-label="Escena animada de Clara preparando una declaración">
      <div className="workspace-camera">
        <picture>
          <source media="(max-width: 680px)" srcSet={heroWorkspaceMobile} />
          <img className="workspace-photo" src={heroWorkspace} alt="" />
        </picture>
      </div>
      <div className="workspace-vignette" />
      <div className="workspace-copy">
        <div className="eyebrow light">DECLARACIÓN DE RENTA POR WHATSAPP</div>
        <h1>Tu declaración.<br /><em>Por fin, clara.</em></h1>
        <p>Clara consulta tu información, encuentra ahorros legales y deja el formulario de la DIAN listo para que lo revises y firmes.</p>
      </div>
      <div className="workspace-actions">
        <Button onClick={start}>Averigua gratis si debes declarar <ArrowRight size={18} /></Button>
        <a className="text-action" href="#como">Mira cómo funciona <span>↓</span></a>
      </div>

      <div className="scroll-cue"><span>Desliza para entrar</span><div /></div>
    </div>
  );
}

function Landing({ goTo }) {
  const [faqOpen, setFaqOpen] = useState(0);
  const [headerSolid, setHeaderSolid] = useState(false);
  const heroRef = useRef(null);
  const faqs = [
    ["¿Es seguro darle mi clave de la DIAN?", "Sí. La conexión va cifrada, tu clave nunca pasa por WhatsApp y puedes pedir que la borremos al terminar."],
    ["¿Clara presenta por mí?", "No. Clara prepara todo, pero la firma y la presentación siempre las haces tú."],
    ["¿Qué pasa si no estoy obligado a declarar?", "Te lo decimos gratis y te damos una constancia que puedes usar con tu banco."],
    ["¿Y si ya tengo contador?", "Puedes usar Clara para comparar, organizar tus soportes o llegar a tu contador con un borrador claro."],
    ["¿Cuánto cuesta y qué incluye?", "Cuesta $59.900 para asalariados y $79.900 para independientes. Solo pagas si decides presentar."],
    ["¿Qué pasa si la DIAN me hace un requerimiento?", "Te ayudamos a entenderlo. Si ocurrió por un error nuestro, la corrección va por nuestra cuenta."],
  ];

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
  return (
    <div className="landing">
      <header className={`site-header ${headerSolid ? "solid" : ""}`}>
        <div className="container nav-inner">
          <Logo light />
          <nav>
            <a href="#como">Cómo funciona</a>
            <a href="#precio">Precio</a>
            <a href="#seguridad">Seguridad</a>
          </nav>
          <Button onClick={start}>Averigua gratis</Button>
        </div>
      </header>

      <main>
        <section className="hero-story" ref={heroRef}>
          <div className="hero-sticky">
            <ClaraWorkspace start={start} />
          </div>
        </section>

        <section className="section problem">
          <div className="container">
            <div className="section-heading"><div className="eyebrow">MENOS VUELTAS</div><h2>Hoy declarar renta es un dolor de cabeza</h2></div>
            <div className="comparison-grid">
              <CompareCard metric="40" metricLabel="casillas por revisar" title="Con el proceso tradicional" items={["Respondes preguntas que muchas veces no te aplican", "Terminas copiando datos y valores en el portal de la DIAN", "Es difícil saber qué cambió y por qué"]} />
              <CompareCard good metric="1" metricLabel="revisión final" title="Con Clara" items={["Solo respondes lo necesario, por WhatsApp", "Recibes el formulario diligenciado para revisarlo", "Cada ahorro incluye su explicación y su soporte"]} />
            </div>
          </div>
        </section>

        <section id="como" className="section steps-section">
          <div className="container">
            <div className="process-intro"><div><div className="eyebrow">ASÍ DE SIMPLE</div><h2>De “no sé por dónde empezar” a “ya quedó”.</h2></div><p>Clara hace el trabajo pesado detrás. Tú solo respondes, revisas y firmas.</p></div>
            <div className="process-showcase">
              <div className="process-phone-stage">
                <img className="process-phone-art" src={phoneArtwork} alt="Conversación con Clara por WhatsApp" />
              </div>
              <div className="process-chapters">
                {[
                  ["01", "Hablas, no llenas formularios", "Clara pregunta una cosa a la vez. En 30 segundos sabe si podrías estar obligado a declarar."],
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
              <h2>Automática,<br /><em>pero nunca a ciegas.</em></h2>
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

        <section id="precio" className="section pricing">
          <div className="container">
            <div className="section-heading"><div className="eyebrow">PRECIO CLARO</div><h2>Un precio claro, sin sorpresas</h2></div>
            <div className="pricing-grid">
              <PriceCard title="Asalariado" price="$59.900" onClick={start} />
              <PriceCard featured title="Independiente o con arriendos" price="$79.900" extra="Manejo de ingresos por cuenta propia, arriendos y dividendos" onClick={start} />
            </div>
            <p className="price-note"><CheckCircle2 size={18} /> ¿No estás obligado a declarar? Te lo decimos gratis antes de que pagues.</p>
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
              {faqs.map(([q, a], i) => (
                <button className={`faq-item ${faqOpen === i ? "open" : ""}`} key={q} onClick={() => setFaqOpen(faqOpen === i ? -1 : i)}>
                  <small>0{i + 1}</small><span>{q}</span><ChevronDown size={20} />
                  <p>{a}</p>
                </button>
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
              <h2>Treinta segundos.<br /><em>Y ya sabes si declaras.</em></h2>
              <p>En 30 segundos sabes si podrías estar obligado. Si continúas, Clara puede dejar tu declaración lista en cerca de 15 minutos.</p>
              <div className="cta-trust"><span><LockKeyhole size={14} /> Datos cifrados</span><span><BadgeCheck size={14} /> Respaldo contable</span></div>
            </div>
            <div className="cta-live-card">
              <div className="cta-chat-head"><Avatar /><div><strong>Clara</strong><span>en línea ahora</span></div><i /></div>
              <div className="cta-bubble">Hola. En 30 segundos te digo gratis si debes declarar este año.</div>
              <div className="cta-result"><span>Consulta inicial</span><strong className="money">$0</strong></div>
              <Button onClick={start}>Hablar con Clara <ArrowRight size={18} /></Button>
              <small>No necesitas tarjeta para empezar</small>
            </div>
          </div>
        </section>
      </main>
      <footer>
        <div className="container footer-shell">
          <div className="footer-lead">
            <div><Logo light /><p>Impuestos claros para gente que tiene mejores cosas que hacer.</p></div>
            <a className="footer-whatsapp" href="#" onClick={(event) => { event.preventDefault(); start(); }}><MessageCircle size={18} /> Habla con Clara <ArrowRight size={16} /></a>
          </div>
          <div className="footer-directory">
            <div><span>PRODUCTO</span><a href="#como">Cómo funciona</a><a href="#precio">Precios</a><button onClick={() => goTo("whatsapp")}>Ver conversación</button></div>
            <div><span>CONFIANZA</span><a href="#seguridad">Seguridad</a><a href="#seguridad">Tratamiento de datos</a><a href="#">Garantía Clara</a></div>
            <div><span>LEGAL</span><a href="#">Términos del servicio</a><a href="#">Política de privacidad</a><a href="#">Contacto</a></div>
          </div>
          <div className="footer-bottom">
            <div className="service-status"><i /> Todos los sistemas operando</div>
            <p>Clara no es la DIAN. Somos un servicio independiente que te ayuda a preparar tu declaración. Tú siempre firmas y presentas.</p>
            <span>© 2026 Clara Colombia</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function CompareCard({ title, items, metric, metricLabel, good = false }) {
  return (
    <article className={`compare-card ${good ? "good" : ""}`}>
      <div className="compare-top"><div className="compare-icon">{good ? <Sparkles size={22} /> : <HelpCircle size={22} />}</div><div className="compare-metric"><strong>{metric}</strong><span>{metricLabel}</span></div></div>
      <h3>{title}</h3>
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

function PriceCard({ title, price, extra, featured, onClick }) {
  const items = ["Consultamos tu información en la DIAN", "Optimizamos tu declaración", "La dejamos lista para revisar y firmar", "Organizamos tu carpeta de soportes", "Garantía: si erramos, la corrección va por nuestra cuenta"];
  return (
    <article className={`price-card ${featured ? "featured" : ""}`}>
      {featured && <div className="featured-label">Más completo</div>}
      <h3>{title}</h3><div className="price money">{price}</div><span className="once">pago único</span>
      <ul>{items.map((item) => <li key={item}><Check size={17} />{item}</li>)}{extra && <li><Check size={17} />{extra}</li>}</ul>
      <Button onClick={onClick}>Empieza gratis por WhatsApp <ArrowRight size={17} /></Button>
    </article>
  );
}

function AppShell({ children, width = "medium", title, subtitle }) {
  return (
    <main className="app-screen">
      <div className="app-ambient ambient-a" /><div className="app-ambient ambient-b" />
      <header className="app-header"><Logo /><div className="secure-chip"><LockKeyhole size={13} /> Sesión segura</div></header>
      <div className={`app-container app-${width}`}>
        {(title || subtitle) && <div className="app-title">{title && <h1>{title}</h1>}{subtitle && <p>{subtitle}</p>}</div>}
        {children}
      </div>
    </main>
  );
}

function ConnectionScreen({ goTo }) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <AppShell width="small">
      <div className="clara-intro"><Avatar size="lg" /><div><span>Clara está contigo</span><h1>Vamos a consultar tu información en la DIAN</h1></div></div>
      <div className="calm-card"><LockKeyhole size={20} /><p><strong>Conexión cifrada.</strong> Tu clave no se guarda en el chat y puedes borrarla al terminar.</p></div>
      <form className="form-card" onSubmit={(e) => { e.preventDefault(); goTo("review"); }}>
        <label>Tipo de documento<select defaultValue="CC"><option>CC</option><option>CE</option><option>Pasaporte</option></select></label>
        <label>Número de documento<input inputMode="numeric" placeholder="1.023.456.789" /></label>
        <label>Año gravable<select defaultValue="2025"><option>2025</option><option>2024</option></select></label>
        <label>Contraseña de la DIAN<div className="password-input"><input type={showPassword ? "text" : "password"} placeholder="Tu contraseña" /><button type="button" aria-label="Mostrar contraseña" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></div></label>
        <label className="checkbox"><input type="checkbox" required /><span>Acepto los <a href="#">términos</a> y la <a href="#">política de tratamiento de datos</a></span></label>
        <Button type="submit" className="full">Consultar mi información <ArrowRight size={18} /></Button>
      </form>
      <div className="app-links"><button>No tengo clave de la DIAN</button><button><Upload size={15} /> Prefiero no darla y subir mis documentos</button></div>
      <p className="legal-note">Clara nunca firma ni presenta con tu clave. Solo consulta y prepara tu borrador.</p>
    </AppShell>
  );
}

const declarationSections = [
  ["Ingresos", [["Ingresos laborales", "$87.400.000", "Reportado por tu empresa", "ok"]]],
  ["Deducciones", [["Aportes a salud y pensión", "-$7.000.000", "Certificados de aportes", "ok"], ["Intereses de vivienda", "-$4.230.000", "Certificado de intereses de Bancolombia", "ok"], ["Dependientes", "-$3.585.528", "Falta adjuntar registro civil", "warn"]]],
  ["Patrimonio", [["Saldo en cuentas", "$18.920.000", "Información exógena DIAN", "ok"]]],
  ["Impuesto", [["Retenciones que ya te hicieron", "-$3.120.000", "Certificado de ingresos y retenciones", "ok"]]],
];

function ReviewScreen({ goTo }) {
  const [open, setOpen] = useState([0, 1, 3]);
  const toggle = (index) => setOpen((value) => value.includes(index) ? value.filter((n) => n !== index) : [...value, index]);
  return (
    <AppShell title="Tu declaración, casilla por casilla" subtitle="Revisa de dónde salió cada peso. Si algo no te cuadra, pregúntame." width="medium">
      <SavingsCard compact />
      <div className="review-list">
        {declarationSections.map(([section, rows], index) => (
          <section className="review-section" key={section}>
            <button className="review-heading" onClick={() => toggle(index)}><span>{section}</span><ChevronDown className={open.includes(index) ? "rotate" : ""} size={20} /></button>
            {open.includes(index) && <div className="review-rows">{rows.map(([name, value, support, status]) => (
              <div className="review-row" key={name}>
                <div className={`row-status ${status}`} /> <div><strong>{name}</strong><span><Paperclip size={13} />{support}</span></div><b className="money">{value}</b>
              </div>
            ))}</div>}
          </section>
        ))}
      </div>
      <div className="bottom-action"><button className="question-link"><MessageCircle size={17} /> Tengo una pregunta</button><Button onClick={() => goTo("optimization")}>Ver mi optimización <ArrowRight size={18} /></Button></div>
    </AppShell>
  );
}

function OptimizationScreen({ goTo }) {
  return (
    <AppShell title="Tu informe de optimización" subtitle="Esto hicimos para que pagues lo justo, sin inventar nada." width="medium">
      <OptimizationSection color="green" title="Lo que aprovechamos este año">
        <Benefit title="Dependientes" amount="ahorraste $980.000" copy="Aplicamos la deducción con el registro civil que adjuntaste." />
        <Benefit title="Intereses de vivienda" amount="ahorraste $310.000" copy="Usamos el certificado de intereses de Bancolombia." />
        <Benefit title="Aportes obligatorios" amount="ahorraste $228.000" copy="Los cruzamos con tu certificado laboral." />
      </OptimizationSection>
      <OptimizationSection color="amber" title="Para el año entrante puedes pagar aún menos">
        <div className="suggestion-card"><div><strong>Una cuenta AFC puede ayudarte</strong><p>Si aportas $3.000.000, pagarías <b className="money">$840.000 menos</b>. Te avisamos en noviembre.</p></div><Button variant="secondary">Recuérdamelo</Button></div>
      </OptimizationSection>
      <OptimizationSection color="red" title="Lo que no hicimos, y por qué te conviene">
        <div className="risk-card"><ShieldCheck size={24} /><div><strong>No inventamos un dependiente</strong><p>Te habría bajado $980.000 hoy, pero si la DIAN lo cruza podrías pagar más de $2.000.000 entre devolución, multa e intereses.</p><div className="risk-math"><span>Ahorro aparente {money("$980.000")}</span><span>Riesgo estimado {money("$2.000.000+")}</span></div></div></div>
      </OptimizationSection>
      <div className="accountant-badge"><BadgeCheck size={20} /> Revisado por un contador del equipo</div>
      <Button className="full" onClick={() => goTo("payment")}>Continuar al pago <ArrowRight size={18} /></Button>
    </AppShell>
  );
}

function OptimizationSection({ color, title, children }) {
  return <section className="optimization-section"><h2><span className={`signal ${color}`} />{title}</h2><div className="optimization-body">{children}</div></section>;
}

function Benefit({ title, amount, copy }) {
  return <div className="benefit-row"><div className="benefit-check"><Check size={17} /></div><div><strong>{title}</strong><p>{copy}</p></div><b>{amount}</b></div>;
}

function PaymentScreen() {
  const [method, setMethod] = useState("PSE");
  return (
    <AppShell title="Presenta tu declaración" subtitle="Un último paso. Después te acompaño a firmar en la DIAN." width="small">
      <div className="order-card">
        <div className="order-head"><div><span>Declaración de renta 2025</span><small>Plan asalariado</small></div><strong className="money">$59.900</strong></div>
        <ul>{["Presentación ante la DIAN acompañada", "Carpeta de soportes 3 años", "Garantía por errores nuestros"].map((text) => <li key={text}><Check size={16} />{text}</li>)}</ul>
      </div>
      <div className="payment-methods">
        <label>¿Cómo quieres pagar?</label>
        {[
          ["PSE", "Débito desde tu banco", "PSE"],
          ["Nequi", "Desde tu celular", "NQ"],
          ["Tarjeta", "Crédito o débito", "VISA"],
        ].map(([name, sub, logo]) => <button key={name} className={method === name ? "selected" : ""} onClick={() => setMethod(name)}><span className="pay-radio" /><div><strong>{name}</strong><small>{sub}</small></div><b>[{logo}]</b></button>)}
      </div>
      <Button className="full">Pagar $59.900 <LockKeyhole size={17} /></Button>
      <p className="payment-note"><CircleDollarSign size={17} /> Solo pagas ahora. El impuesto, si te da a pagar, lo pagas directo a la DIAN dentro del plazo.</p>
    </AppShell>
  );
}

function WhatsAppScreen({ goTo }) {
  return (
    <main className="wa-screen">
      <div className="wa-stage-copy">
        <Logo light />
        <div className="eyebrow light">ASÍ EMPIEZA TODO</div>
        <h1>Una conversación. Una pregunta a la vez.</h1>
        <p>Sin formularios eternos. Clara entiende tu caso y solo pregunta lo que importa.</p>
        <Button onClick={() => goTo("connection")}>Continuar a conexión DIAN <ArrowRight size={18} /></Button>
      </div>
      <div className="wa-phone-wrap"><img className="wa-generated-art" src={phoneArtwork} alt="Conversación de Clara por WhatsApp" /><span>Así se siente declarar con Clara</span></div>
    </main>
  );
}

export default function App() {
  const [screen, setScreen] = useState("landing");
  const goTo = (next) => {
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  useEffect(() => {
    document.title = `Clara | ${SCREENS.find(([id]) => id === screen)?.[1]}`;
  }, [screen]);

  return (
    <>
      <ScreenTabs active={screen} onChange={goTo} />
      <div key={screen} className="screen-transition">
        {screen === "landing" && <Landing goTo={goTo} />}
        {screen === "connection" && <ConnectionScreen goTo={goTo} />}
        {screen === "review" && <ReviewScreen goTo={goTo} />}
        {screen === "optimization" && <OptimizationScreen goTo={goTo} />}
        {screen === "payment" && <PaymentScreen />}
        {screen === "whatsapp" && <WhatsAppScreen goTo={goTo} />}
      </div>
    </>
  );
}
