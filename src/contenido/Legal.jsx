/**
 * Terminos y condiciones, y politica de tratamiento de datos.
 *
 * ═══ POR QUE ESTA PAGINA NO EXISTIA Y POR QUE IMPORTA ═══
 *
 * El formulario de la consulta tiene una casilla obligatoria que dice "Acepto los terminos y la
 * politica de datos", y ese enlace respondia 404. Se estaba pidiendo consentimiento sobre un
 * documento que no existia, con datos personales y ademas con la clave del portal de la DIAN de
 * por medio. La Ley 1581 de 2012 exige que la politica este disponible ANTES de recoger el dato,
 * y el Estatuto del Consumidor exige que las condiciones del servicio sean conocibles.
 *
 * ═══ EN QUE SE DIFERENCIA DE LO QUE HACE LA COMPETENCIA ═══
 *
 * El documento de referencia del sector son dieciseis paginas de bloque corrido que nadie lee, y
 * ahi esta el problema: un consentimiento que nadie puede leer es un consentimiento debil. Este
 * esta escrito para leerse, con la seccion mas delicada (la clave de la DIAN) tratada aparte y
 * con nombre propio en vez de escondida entre las definiciones.
 *
 * Y dice lo que de verdad hacemos, que es lo que un documento generico no puede decir: que la
 * clave se guarda cifrada y se puede borrar cuando la persona quiera, y que Clara NUNCA firma ni
 * presenta. Esa segunda es la diferencia grande con el resto del mercado, es la que mas nos
 * protege, y es la que mas confusion evita.
 *
 * ═══ LO QUE FALTA ═══
 *
 * Un abogado que lo revise, sobre todo la seccion de responsabilidad, donde asumimos hacernos
 * cargo de sanciones por errores nuestros de calculo. Y el identificador societario cuando exista
 * la sociedad, que se llena en `RESPONSABLE` y la pagina lo intercala sola.
 */
import Seo from "../seo/Seo";
import { Cabecera, Pie } from "../comun/Marco";
import { abrirWhatsApp } from "../App";

const RUTA = "/terminos";
const ACTUALIZADO = "2 de septiembre de 2026";

/**
 * Quien responde por el tratamiento de los datos.
 *
 * Hoy no hay sociedad constituida, asi que el responsable se identifica por la marca, el
 * domicilio y el canal de contacto. Lo que la persona necesita saber para ejercer sus derechos
 * (a quien le escribe y donde) esta completo; lo que falta es el identificador societario.
 *
 * CUANDO EXISTA LA SOCIEDAD, llenar `razonSocial` y `nit` aca: la pagina los intercala sola en
 * la presentacion y en el pie, sin tocar nada mas.
 */
const RESPONSABLE = {
  marca: "Clara",
  razonSocial: null,
  nit: null,
  ciudad: "Bogotá, Colombia",
  correo: "hola@declaras.co",
  sitio: "declaras.co",
};

const SECCIONES = [
  ["que-es", "Qué es Clara y qué hace"],
  ["que-no", "Qué no hace Clara"],
  ["usar", "Para usar Clara"],
  ["precio", "Precio y pago"],
  ["responsabilidad", "Nuestra responsabilidad"],
  ["propiedad", "Propiedad intelectual"],
  ["cambios", "Cambios y ley aplicable"],
  ["datos", "Política de datos: qué recogemos"],
  ["clave", "Tu clave de la DIAN"],
  ["comparte", "Con quién los compartimos"],
  ["guardamos", "Cuánto los guardamos"],
  ["derechos", "Tus derechos"],
  ["cookies", "Cookies y medición"],
];

export default function Legal() {
  return (
    <div className="legal">
      <Seo
        titulo="Términos y política de datos | Clara"
        descripcion="Las condiciones del servicio de Clara y cómo tratamos tus datos personales, incluida tu clave de la DIAN. Escrito para leerse."
        ruta={RUTA}
      />
      <Cabecera solida alCta={() => abrirWhatsApp()} />

      <header className="legal-top">
        <div className="container legal-ancho">
          <nav className="post-migas" aria-label="Ruta">
            <a href="/">Clara</a>
            <span aria-hidden="true">/</span>
            <span>Términos y política de datos</span>
          </nav>
          <h1>Términos y política de datos</h1>
          <p className="legal-bajada">
            Dos documentos en una página: las condiciones del servicio y qué hacemos con tus
            datos. Están escritos para que se puedan leer, porque un permiso que nadie entiende
            no es un permiso.
          </p>
          <p className="legal-fecha">Actualizado el {ACTUALIZADO}</p>
        </div>
      </header>

      <main className="container legal-ancho legal-cuerpo">
        <nav className="legal-indice" aria-label="Contenido">
          <b>En esta página</b>
          <ol>
            {SECCIONES.map(([id, texto]) => (
              <li key={id}><a href={`#${id}`}>{texto}</a></li>
            ))}
          </ol>
        </nav>

        <article>
          <p className="legal-intro">
            <b>{RESPONSABLE.marca}</b> es un servicio para preparar tu declaración de renta en
            Colombia
            {RESPONSABLE.razonSocial ? `, operado por ${RESPONSABLE.razonSocial}` : ""}
            {RESPONSABLE.nit ? ` (NIT ${RESPONSABLE.nit})` : ""}, con domicilio en{" "}
            {RESPONSABLE.ciudad}. Somos los responsables de tus datos y respondemos en{" "}
            <b>{RESPONSABLE.correo}</b>. Al usar {RESPONSABLE.sitio} o escribirnos por WhatsApp
            aceptas lo que dice esta página.
          </p>

          <h2>Términos y condiciones</h2>

          <section id="que-es">
            <h3>Qué es Clara y qué hace</h3>
            <p>
              Clara revisa lo que la DIAN ya tiene reportado a tu nombre, te dice si estás
              obligado a declarar renta y, si nos contratas, prepara tu declaración y la deja
              lista como borrador en tu cuenta del portal de la DIAN.
            </p>
            <p>
              También podemos ayudarte con trámites previos cuando no puedes entrar al portal:
              sacar el RUT, habilitar tu cuenta o recuperar tu clave. Eso se cotiza aparte y
              siempre te decimos el precio antes de empezar.
            </p>
          </section>

          <section id="que-no">
            <h3>Qué no hace Clara</h3>
            <div className="legal-destacado">
              <b>Nunca firmamos ni presentamos tu declaración.</b>
              <p>
                La firma electrónica ante la DIAN es personal e intransferible. Clara deja todo
                listo, pero entrar a firmar y presentar lo haces tú, siempre. Si alguien te
                ofrece firmar por ti, desconfía.
              </p>
            </div>
            <p>
              Tampoco somos tu representante ante la DIAN, no recibimos ni pagamos impuestos por
              ti, y no respondemos requerimientos en tu nombre salvo que lo acordemos aparte y
              por escrito.
            </p>
          </section>

          <section id="usar">
            <h3>Para usar Clara</h3>
            <ul>
              <li>Tienes que ser mayor de 18 años y actuar por ti mismo.</li>
              <li>
                La información que nos das tiene que ser verdadera y completa. Tu declaración se
                arma con lo que nos cuentas y con lo que la DIAN tiene reportado; si algo de lo
                que nos das es falso o queda por fuera, el resultado cambia.
              </li>
              <li>
                Si nos das datos de otra persona, entendemos que tienes su permiso para hacerlo.
              </li>
            </ul>
          </section>

          <section id="precio">
            <h3>Precio y pago</h3>
            <p>
              El precio del servicio se te dice antes de empezar y no cambia después sin que lo
              aceptes. Saber si estás obligado a declarar es gratis cuando puedes entrar al
              portal de la DIAN con tu clave.
            </p>
            <p>
              El impuesto que resulte de tu declaración lo pagas tú directamente a la DIAN. Ese
              valor no es nuestro y no lo cobramos nosotros.
            </p>
          </section>

          <section id="responsabilidad">
            <h3>Nuestra responsabilidad</h3>
            <p>
              Nos comprometemos a preparar tu declaración con cuidado y de acuerdo con las normas
              vigentes. Si tu declaración queda mal por un error nuestro de cálculo o de
              diligenciamiento, nos hacemos cargo de corregirla y de la sanción o los intereses
              que se deriven de ese error.
            </p>
            <p>No cubrimos, en cambio:</p>
            <ul>
              <li>Información incompleta o equivocada que nos hayas dado.</li>
              <li>
                Que no firmes o no presentes a tiempo. El plazo lo fija la DIAN según los dos
                últimos dígitos de tu cédula y presentar es tu paso.
              </li>
              <li>Cambios de criterio de la DIAN o de la ley posteriores a tu declaración.</li>
              <li>
                Fallas del portal de la DIAN, que no controlamos. Si el portal está caído, te
                avisamos.
              </li>
            </ul>
            <p>
              La respuesta gratuita sobre si estás obligado se basa en lo que la DIAN tiene
              reportado al momento de la consulta. La DIAN puede recibir reportes nuevos durante
              el año, así que si tu situación cambia conviene volver a consultar antes de la
              fecha límite.
            </p>
          </section>

          <section id="propiedad">
            <h3>Propiedad intelectual</h3>
            <p>
              La marca Clara, el sitio, el software y todo lo que hay en él son nuestros. Puedes
              usar el servicio, no copiarlo, revenderlo ni extraer su contenido de forma
              automatizada.
            </p>
            <p>Tus documentos y tus datos siguen siendo tuyos. Los usamos solo para atenderte.</p>
          </section>

          <section id="cambios">
            <h3>Cambios y ley aplicable</h3>
            <p>
              Podemos cambiar estas condiciones. Si el cambio es de fondo, te avisamos por el
              correo o el WhatsApp que nos diste antes de que aplique. Esta página siempre muestra
              arriba la fecha de la última actualización.
            </p>
            <p>
              Este acuerdo se rige por las leyes de Colombia. Si tenemos un problema, primero
              intentamos resolverlo escribiéndonos a {RESPONSABLE.correo}.
            </p>
          </section>

          <h2 className="legal-h2-segundo">Política de tratamiento de datos personales</h2>
          <p className="legal-nota">
            En cumplimiento de la Ley 1581 de 2012 y el Decreto 1074 de 2015.
          </p>

          <section id="datos">
            <h3>Qué datos recogemos</h3>
            <ul>
              <li><b>Para contactarte:</b> tu nombre, tu correo y tu número de WhatsApp.</li>
              <li>
                <b>Para consultar la DIAN:</b> tu número de cédula y tu clave del portal.
              </li>
              <li>
                <b>Lo que baja de la DIAN:</b> tu RUT, la información que terceros reportaron a tu
                nombre, tus declaraciones anteriores y el borrador que la DIAN te sugiere.
              </li>
              <li>
                <b>Lo que tú nos mandes:</b> certificados, soportes de deducciones y los
                documentos que hagan falta para tu declaración.
              </li>
              <li>
                <b>De tu navegación:</b> páginas que visitas y en qué botones tocas, sin nombre ni
                cédula asociados hasta que nos dejas tus datos.
              </li>
            </ul>
            <p>
              Los usamos para tres cosas: decirte si estás obligado a declarar, preparar tu
              declaración, y hablar contigo por WhatsApp o correo sobre tu caso. También miramos
              el uso agregado del sitio para mejorarlo.
            </p>
          </section>

          <section id="clave">
            <h3>Tu clave de la DIAN</h3>
            <div className="legal-destacado">
              <p>
                Es el dato más delicado que manejamos, así que va aparte y con nombre propio.
              </p>
              <ul>
                <li>
                  <b>Se guarda cifrada</b>, nunca en texto plano, y solo la usamos para entrar al
                  portal a nombre tuyo cuando estamos trabajando en tu caso.
                </li>
                <li>
                  <b>No viaja por WhatsApp.</b> Se escribe únicamente en el sitio, sobre una
                  conexión cifrada.
                </li>
                <li>
                  <b>La guardamos porque preparar una declaración toma varios días</b> y varias
                  entradas al portal. Si no la guardáramos tendríamos que pedírtela cada vez.
                </li>
                <li>
                  <b>Puedes pedirnos que la borremos cuando quieras</b>, y la borramos. Escríbenos
                  a {RESPONSABLE.correo} o dilo por WhatsApp.
                </li>
                <li>
                  <b>Nunca la usamos para firmar ni para presentar</b>, porque eso no lo hacemos.
                </li>
              </ul>
            </div>
            <p>
              Un aviso que te conviene conocer: la DIAN bloquea la cuenta al tercer intento
              fallido de clave. Por eso nuestro sistema se detiene solo en el segundo intento,
              para no dejarte por fuera de tu propia cuenta.
            </p>
          </section>

          <section id="comparte">
            <h3>Con quién los compartimos</h3>
            <p>No vendemos tus datos ni los cedemos para publicidad de terceros. Los tratan:</p>
            <ul>
              <li>
                <b>La DIAN</b>, que es de donde viene y a donde va tu información tributaria.
              </li>
              <li>
                <b>Nuestros proveedores de tecnología</b>, que alojan el sitio, la base de datos y
                la medición de uso.
              </li>
              <li>
                <b>WhatsApp</b>, cuando la conversación es por ahí.
              </li>
              <li>
                <b>Autoridades</b>, si una orden legal nos obliga.
              </li>
            </ul>
            <p>
              Algunos de esos proveedores están fuera de Colombia, principalmente en Estados
              Unidos, así que al aceptar esta política autorizas esa transferencia internacional
              con las garantías de seguridad y confidencialidad que exige la ley.
            </p>
          </section>

          <section id="guardamos">
            <h3>Cuánto los guardamos</h3>
            <p>
              Tu declaración y sus soportes los conservamos mientras la DIAN pueda revisarla, que
              es el plazo de firmeza de tu declaración, porque si te llega un requerimiento vas a
              necesitar respaldarla. Tu clave se borra cuando nos lo pidas o cuando termine tu
              caso, lo que ocurra primero. Si nunca llegaste a contratarnos, borramos tus datos de
              contacto cuando nos lo pidas.
            </p>
          </section>

          <section id="derechos">
            <h3>Tus derechos</h3>
            <p>
              Puedes pedirnos en cualquier momento que te digamos qué tenemos tuyo, que lo
              corrijamos, que lo borremos, o retirar el permiso que nos diste. También puedes
              quejarte ante la Superintendencia de Industria y Comercio.
            </p>
            <p>
              Se hace escribiendo a <b>{RESPONSABLE.correo}</b> desde el correo que nos diste, o
              por WhatsApp desde tu número. Contamos con quince días hábiles para responderte, que
              es lo que da la ley, aunque normalmente respondemos el mismo día.
            </p>
          </section>

          <section id="cookies">
            <h3>Cookies y medición</h3>
            <p>
              Usamos herramientas que miden cómo se usa el sitio para saber dónde se atasca la
              gente y arreglarlo, y herramientas de publicidad para saber qué anuncio te trajo.
              Puedes bloquearlas desde tu navegador; el sitio sigue funcionando igual.
            </p>
          </section>

          <p className="legal-cierre">
            ¿Algo de esto no te queda claro? Escríbenos a {RESPONSABLE.correo} y te lo explicamos
            en palabras normales. Preferimos eso a que aceptes algo que no entendiste.
          </p>
        </article>
      </main>

      <Pie alCta={() => abrirWhatsApp()} />
    </div>
  );
}
