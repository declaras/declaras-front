/**
 * La ruta `/login`, con su propio proveedor de sesion.
 *
 * POR QUE ES UN ARCHIVO APARTE DE UNA LINEA. `main.jsx` carga la consola y las paginas de
 * contenido con `lazy` porque eran un solo paquete de 390 kB y quien llegaba a la guia desde un
 * buscador se descargaba tambien la consola entera. El cliente de Supabase pesa, y si el proveedor
 * se pusiera en `main.jsx` para envolver las dos rutas, entraria al paquete principal y lo cargaria
 * TODO EL MUNDO —incluida la portada—, deshaciendo justo esa optimizacion.
 *
 * Asi el proveedor viaja dentro del pedazo que se descarga solo cuando alguien va a `/login` o a
 * `/consola`. Son dos instancias del proveedor y nunca estan montadas a la vez; da igual, porque la
 * sesion no vive en el estado de React sino en el almacenamiento del navegador, y las dos leen lo
 * mismo.
 */

import Entrar from "./Entrar";
import { ProveedorDeSesion } from "./sesion";

export default function Login() {
  return (
    <ProveedorDeSesion>
      <Entrar />
    </ProveedorDeSesion>
  );
}
