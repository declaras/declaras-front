/**
 * La reja de la consola: nadie llega al proxy sin haber entrado con la clave.
 *
 * ═══ POR QUE EXISTE, Y POR QUE ESTA ACA Y NO EN LA PANTALLA ═══
 *
 * `api/proxy.js` le pone la llave del backend a toda peticion que le llegue. Eso es lo correcto
 * —la llave nunca baja al navegador— pero convierte al proxy en un portero que le abre a
 * cualquiera Y ADEMAS pone la credencial de su bolsillo. Medido antes de escribir esto:
 *
 *     curl https://declaras.vercel.app/api/v1/clients   ->   200
 *     2 clientes, con id_number, full_name, phone_number, email
 *
 * Sin llave, sin cookie, sin navegador. Cedulas y correos de personas reales.
 *
 * Por eso la reja va en `/api/*` y no en la pantalla: un atacante NO CARGA la pantalla, le habla
 * al proxy con curl. Ponerle clave a `/consola` y dejar `/api` abierto no tapa nada. Se gatean
 * las dos, y la que importa es la primera.
 *
 * ═══ POR QUE LA CLAVE NO ES LA LLAVE DE LA API ═══
 *
 * La tentacion es pedir la propia `DECLARAS_API_KEY` como contrasena. No: eso la mete en el
 * navegador, que es justo lo que el proxy existe para evitar. Una vez sale, quien la tenga le
 * pega DIRECTO a Railway saltandose todo esto, no expira, es la misma para todos, y revocarla
 * saca a todo el mundo. Aca la clave abre una SESION —una cookie firmada, con vencimiento,
 * `HttpOnly` para que ni un XSS la lea— y la llave del backend sigue viviendo solo en el proxy.
 *
 * ═══ LO QUE ESTO NO ES ═══
 *
 * No es autenticacion de personas. Es una clave compartida: sabe que alguien autorizado entro,
 * no QUIEN. Por eso la bitacora sigue firmando "contador" (`Conciliacion.jsx`). Es una tapa
 * temporal para la ventana del piloto, y se cae el dia que exista el ingreso del contribuyente
 * —que hace falta igual, porque el va a entrar a ver lo suyo.
 *
 * ═══ POR QUE EL LOGIN VIVE ACA DENTRO ═══
 *
 * El middleware corre ANTES de los rewrites de `vercel.json`, asi que ve `/api/entrar` antes de
 * que el catch-all `/api/(.*)` lo mande al proxy. Atenderlo aca evita depender de si el sistema
 * de archivos le gana o no a la regla de reescritura — una sutileza que nadie deberia tener que
 * recordar al agregar la proxima ruta.
 */

import { next } from "@vercel/functions";

export const config = {
  matcher: ["/api/:ruta*", "/consola", "/consola/:ruta*"],
};

const COOKIE = "declaras_sesion";
const VIGENCIA_SEGUNDOS = 12 * 60 * 60;

const CLAVE = process.env.DECLARAS_CONSOLA_PASSWORD;
const SECRETO = process.env.DECLARAS_CONSOLA_SECRET;

export default async function middleware(request) {
  const { pathname } = new URL(request.url);

  // SIN CONFIGURAR SE CIERRA, NO SE ABRE. Una variable que falta es la forma mas facil de que
  // una reja quede de adorno: se despliega a un entorno nuevo, nadie copia los secretos, y el
  // sitio queda exactamente igual de abierto que antes pero con la tranquilidad de creer que no.
  if (!CLAVE || !SECRETO) {
    return respuesta(request, 503, {
      code: "CONSOLA_SIN_CONFIGURAR",
      message: "El acceso a la consola no está configurado.",
      retryable: false,
    });
  }

  if (pathname === "/api/entrar") return await entrar(request);
  if (pathname === "/api/salir") return salir();

  if (await sesionValida(request)) return next();

  return respuesta(request, 401, {
    code: "SIN_SESION",
    message: "Necesitas la clave de la consola para entrar.",
    retryable: false,
  });
}

async function entrar(request) {
  if (request.method !== "POST") return new Response(null, { status: 405 });

  const { clave } = await request.json().catch(() => ({}));

  // Se comparan las FIRMAS y no las cadenas: igualarlas caracter a caracter delata la longitud
  // de la clave y, con suficientes intentos, cada acierto parcial. Dos HMAC del mismo largo no
  // dicen nada al cronometro.
  if (typeof clave !== "string" || !iguales(await firmar(clave), await firmar(CLAVE))) {
    return Response.json(
      { code: "CLAVE_INCORRECTA", message: "Esa no es la clave.", retryable: false },
      { status: 401 },
    );
  }

  const vence = Math.floor(Date.now() / 1000) + VIGENCIA_SEGUNDOS;
  const galleta = `${vence}.${await firmar(String(vence))}`;

  return new Response(null, {
    status: 204,
    headers: {
      "set-cookie":
        `${COOKIE}=${galleta}; Path=/; Max-Age=${VIGENCIA_SEGUNDOS}; ` +
        "HttpOnly; Secure; SameSite=Strict",
    },
  });
}

function salir() {
  return new Response(null, {
    status: 204,
    headers: {
      "set-cookie": `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`,
    },
  });
}

async function sesionValida(request) {
  const galleta = leerCookie(request, COOKIE);
  if (!galleta) return false;

  const corte = galleta.lastIndexOf(".");
  if (corte < 1) return false;

  const vence = galleta.slice(0, corte);
  const firma = galleta.slice(corte + 1);

  // El vencimiento se comprueba ADEMAS de la firma, no en vez de. La firma prueba que el numero
  // lo escribimos nosotros; que ese numero ya paso es una decision aparte.
  if (!/^\d+$/.test(vence) || Number(vence) <= Math.floor(Date.now() / 1000)) return false;

  return iguales(firma, await firmar(vence));
}

function leerCookie(request, nombre) {
  const crudas = request.headers.get("cookie");
  if (!crudas) return null;
  for (const parte of crudas.split(";")) {
    const corte = parte.indexOf("=");
    if (corte < 0) continue;
    if (parte.slice(0, corte).trim() === nombre) return parte.slice(corte + 1).trim();
  }
  return null;
}

async function firmar(mensaje) {
  const bytes = new TextEncoder();
  const llave = await crypto.subtle.importKey(
    "raw",
    bytes.encode(SECRETO),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const firma = await crypto.subtle.sign("HMAC", llave, bytes.encode(mensaje));
  return [...new Uint8Array(firma)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Comparacion de tiempo constante. Las dos entradas son HMAC en hexadecimal, del mismo largo. */
function iguales(a, b) {
  if (a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i++) diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferencia === 0;
}

/**
 * El rechazo, en el idioma de quien pregunta.
 *
 * Al navegador que viene por `/consola` se le da la pantalla de la clave; a curl y al `fetch` de
 * la consola se les da JSON con el mismo codigo que el cliente de la API ya sabe interpretar.
 * Se decide por la ruta y no por el `Accept`, que un atacante controla.
 */
function respuesta(request, status, cuerpo) {
  const { pathname } = new URL(request.url);
  if (pathname.startsWith("/api/")) return Response.json(cuerpo, { status });
  return new Response(pantalla(cuerpo.message), {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function pantalla(mensaje) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Consola · Declaras</title>
<style>
  :root { color-scheme: light dark; }
  body { min-height: 100dvh; margin: 0; display: grid; place-items: center;
         font: 16px/1.5 system-ui, sans-serif; background: #f6f7f9; color: #16181d; }
  @media (prefers-color-scheme: dark) { body { background: #16181d; color: #f6f7f9; } }
  form { width: min(22rem, 90vw); display: grid; gap: .75rem; }
  h1 { font-size: 1.125rem; margin: 0; }
  p { margin: 0; opacity: .7; font-size: .875rem; }
  input, button { font: inherit; padding: .625rem .75rem; border-radius: .5rem;
                  border: 1px solid color-mix(in srgb, currentColor 25%, transparent); }
  input { background: transparent; color: inherit; }
  button { border: 0; background: #1f6feb; color: #fff; cursor: pointer; }
  [role=alert] { color: #d1242f; font-size: .875rem; min-height: 1.25rem; }
</style>
</head>
<body>
<form id="f">
  <h1>Consola de Declaras</h1>
  <p>${mensaje}</p>
  <input id="c" type="password" name="clave" placeholder="Clave" autocomplete="current-password"
         autofocus required>
  <button type="submit">Entrar</button>
  <span role="alert" id="e"></span>
</form>
<script>
document.getElementById("f").addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const aviso = document.getElementById("e");
  aviso.textContent = "";
  const respuesta = await fetch("/api/entrar", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ clave: document.getElementById("c").value }),
  }).catch(() => null);
  if (respuesta && respuesta.ok) location.reload();
  else aviso.textContent = respuesta && respuesta.status === 401
    ? "Esa no es la clave."
    : "No se pudo entrar. Intenta de nuevo.";
});
</script>
</body>
</html>`;
}
