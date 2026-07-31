import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  CircleDollarSign,
  Eye,
  EyeOff,
  LockKeyhole,
  MessageCircle,
  Paperclip,
  ShieldCheck,
  Upload,
} from "lucide-react";

import CampoNumero from "../comun/CampoNumero";
import { Avatar, Button, Logo, money, RecorteTelefono } from "../comun/piezas";

/**
 * Las pantallas del prototipo: conexion con la DIAN, revision, optimizacion, pago y el chat.
 *
 * POR QUE VIVEN APARTE Y SE CARGAN SOLAS: son una maqueta para mostrar el producto, no el producto.
 * Estaban dentro del mismo archivo de la portada, asi que viajaban en el paquete de todo el que
 * entraba al sitio, y peor, el boton principal llevaba a ellas. En produccion alguien pulsaba
 * "Averigua gratis" y aterrizaba en una pantalla falsa.
 *
 * Ahora el modulo entero solo se descarga cuando el prototipo esta encendido (en desarrollo, o con
 * ?prototipo=1). En una visita normal este codigo no existe.
 */

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
  const [documento, setDocumento] = useState("");
  return (
    <AppShell width="small">
      <div className="clara-intro"><Avatar size="lg" /><div><span>Clara está contigo</span><h1>Vamos a consultar tu información en la DIAN</h1></div></div>
      <div className="calm-card"><LockKeyhole size={20} /><p><strong>Conexión cifrada.</strong> Tu clave no se guarda en el chat y puedes borrarla al terminar.</p></div>
      <form className="form-card" onSubmit={(e) => { e.preventDefault(); goTo("review"); }}>
        <label>Tipo de documento<select defaultValue="CC"><option>CC</option><option>CE</option><option>Pasaporte</option></select></label>
        <label>Número de documento<CampoNumero moneda={false} valor={documento} alCambiar={setDocumento} placeholder="1.023.456.789" /></label>
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
        <div className="order-head"><div><span>Declaración de renta 2025</span><small>Pago único</small></div><strong className="money">$50.000</strong></div>
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
      <Button className="full">Pagar $50.000 <LockKeyhole size={17} /></Button>
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
      <div className="wa-phone-wrap"><RecorteTelefono className="wa-generated-art" alt="Conversación de Clara por WhatsApp" /><span>Así se siente declarar con Clara</span></div>
    </main>
  );
}

const PANTALLAS = {
  connection: ConnectionScreen,
  review: ReviewScreen,
  optimization: OptimizationScreen,
  payment: PaymentScreen,
  whatsapp: WhatsAppScreen,
};

export default function Pantallas({ nombre, goTo }) {
  const Elegida = PANTALLAS[nombre];
  return Elegida ? <Elegida goTo={goTo} /> : null;
}
