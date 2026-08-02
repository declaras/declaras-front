/**
 * La sesion del contador: quien entro, y el token con que se le habla al backend.
 *
 * ═══ POR QUE LA LLAVE ANONIMA SI PUEDE ESTAR EN EL NAVEGADOR ═══
 *
 * Todo lo que hay aca es publico —cualquiera abre las herramientas del navegador y lo lee—, asi
 * que hay que ser explicito sobre por que esto no repite el error del que venimos.
 *
 * La `anon key` NO es una credencial de acceso: es el identificador publico del proyecto, hecho
 * para vivir en un cliente. Por si sola no lee ni escribe nada. Lo que autoriza es el TOKEN que
 * Supabase emite despues de que alguien prueba quien es con su clave, y ese token representa a esa
 * persona.
 *
 * Y hay una segunda razon, propia de este proyecto: el Data API de Supabase esta APAGADO. Sin el,
 * la llave anonima no tiene ni siquiera una tabla a la que preguntarle — solo sirve para el login.
 * Si algun dia alguien lo enciende, esa llave pasa a poder leer lo que las politicas de RLS
 * permitan, y en este proyecto NO HAY POLITICAS: encenderlo obliga a escribirlas primero.
 *
 * Contrastalo con la `DECLARAS_API_KEY`: esa si es una credencial de servicio, sirve para todo, es
 * la misma para todos y por eso vive en el proxy y nunca baja aca.
 *
 * ═══ DONDE VIVE EL TOKEN, Y QUE SE ACEPTA CON ESO ═══
 *
 * En el almacenamiento del navegador, que es donde lo pone el cliente de Supabase. Eso significa
 * que un XSS en esta pagina podria leerlo. Se acepta a conciencia y no por descuido: la
 * alternativa —cookies `HttpOnly`— exige un servidor que maneje el intercambio, o sea justo el
 * intermediario que estamos tratando de borrar.
 *
 * Lo que hace el riesgo tolerable: la consola es una herramienta interna sin contenido de
 * terceros, el token vence en una hora, y se puede revocar desde Supabase. No es la respuesta
 * final; es la correcta para una sola persona operando su propia herramienta.
 */

import { createClient } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const URL_SUPABASE = import.meta.env.VITE_SUPABASE_URL;
const LLAVE_ANONIMA = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hayProyecto = Boolean(URL_SUPABASE && LLAVE_ANONIMA);

let _cliente = null;

/**
 * El cliente de Supabase, construido la PRIMERA VEZ QUE SE USA. `null` sin configuracion.
 *
 * ═══ POR QUE PEREZOSO Y NO UNA CONSTANTE DEL MODULO ═══
 *
 * Estaba como constante y rompio el build, no en ejecucion. El paso de prerender importa
 * `entrada-servidor.jsx`, que importa la consola, que importa este archivo — y en Node el cliente
 * revienta con "native WebSocket not found", porque su capa de realtime lo exige y este Node es 20.
 *
 * Construirlo al usarlo lo arregla de raiz y no con un parche: durante el build NADIE llama a
 * `entrar` ni a `tokenVigente`, asi que el cliente no se crea. Y es lo correcto igual — armar una
 * conexion de realtime que este proyecto no usa, solo por importar un modulo, no tenia sentido ni
 * en el navegador.
 *
 * NO se inventa un cliente con valores vacios cuando falta configuracion: fallaria adentro del SDK
 * con un error que no dice lo que pasa. Sin configuracion la pantalla de entrar lo dice, y no
 * ofrece un formulario que no puede funcionar.
 */
export function cliente() {
  if (!hayProyecto) return null;
  _cliente ??= createClient(URL_SUPABASE, LLAVE_ANONIMA, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // El token no viaja en la direccion: esta consola no usa enlaces magicos ni OAuth, y
      // dejarlo prendido significa que un token podria quedar en el historial del navegador
      // o en el `Referer` de la siguiente peticion.
      detectSessionInUrl: false,
    },
  });
  return _cliente;
}

const SesionContext = createContext({
  sesion: null,
  cargando: true,
  entrar: async () => {},
  salir: async () => {},
});

export function ProveedorDeSesion({ children }) {
  const [sesion, setSesion] = useState(null);
  // Arranca en `true` a proposito: al recargar, el SDK tarda un instante en leer la sesion
  // guardada. Sin este estado la consola pintaria la pantalla de entrar y saltaria a la
  // aplicacion un parpadeo despues, que se ve como un error.
  const [cargando, setCargando] = useState(hayProyecto);

  useEffect(() => {
    const sb = cliente();
    if (!sb) return;

    let vivo = true;
    sb.auth.getSession().then(({ data }) => {
      if (!vivo) return;
      setSesion(data.session ?? null);
      setCargando(false);
    });

    // Escuchar los cambios no es opcional: el token se renueva solo cada hora, y sin esto la
    // aplicacion se quedaria con el viejo en memoria y empezaria a recibir 401 sin razon
    // aparente. Tambien cubre cerrar sesion en otra pestana.
    const { data: suscripcion } = sb.auth.onAuthStateChange((_evento, nueva) => {
      setSesion(nueva);
      setCargando(false);
    });

    return () => {
      vivo = false;
      suscripcion.subscription.unsubscribe();
    };
  }, []);

  const entrar = useCallback(async (correo, clave) => {
    const sb = cliente();
    if (!sb) throw new Error("El ingreso no está configurado.");
    const { error } = await sb.auth.signInWithPassword({
      email: correo.trim(),
      password: clave,
    });
    if (error) throw error;
  }, []);

  const salir = useCallback(async () => {
    await cliente()?.auth.signOut();
  }, []);

  const valor = useMemo(() => ({ sesion, cargando, entrar, salir }), [sesion, cargando, entrar, salir]);
  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}

export const useSesion = () => useContext(SesionContext);

/**
 * El token para la cabecera `Authorization`, o `null`.
 *
 * Lo pide `api.js` en CADA peticion en vez de guardarlo: `getSession` devuelve el token vigente y
 * lo renueva si hace falta. Guardarlo en una variable produciria el bug de la hora — todo
 * funciona bien hasta que vence, y entonces la consola empieza a dar 401 sin que nadie haya
 * tocado nada.
 */
export async function tokenVigente() {
  const sb = cliente();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.access_token ?? null;
}

/**
 * Cierra la sesion sin pasar por la interfaz.
 *
 * La llama `api.js` cuando el backend responde `TOKEN_INVALIDO`: el token vencio o se revoco, asi
 * que la sesion que el navegador cree tener ya no vale. Limpiarla hace que `Protegida` mande a
 * `/login` en el proximo pintado, en vez de dejar la consola intentando con un token muerto.
 *
 * `onAuthStateChange` avisa del cambio, asi que el estado de React se actualiza solo y no hace
 * falta que quien llama sepa nada de React.
 */
export async function cerrarSesionLocal() {
  await cliente()?.auth.signOut();
}
