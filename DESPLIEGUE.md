# Despliegue

El sitio se publica en Vercel desde la rama `main`. El repositorio es publico: en el plan Hobby de
Vercel un repositorio privado que pertenece a una organizacion no se puede desplegar, y durante una
semana todos los despliegues fallaron con "Cannot deploy from a private GitHub organization
repository on the Hobby plan" mientras el sitio seguia sirviendo una version vieja. La configuracion vive en `vercel.json`, que no
admite comentarios porque Vercel lo valida contra un esquema estricto y rechaza cualquier clave que
no conozca. Por eso las razones estan aca.

## Por que hace falta declarar el build

Sin `vercel.json`, Vercel detectaba Vite y corria `vite build` a secas. El despliegue salia en verde
y la portada se veia bien, pero las cuatro guias y el sitemap devolvian 404: ni `sitemap.mjs` ni
`prerender.mjs` llegaban a ejecutarse. La portada funcionaba porque su HTML es el `index.html` del
repositorio, y `robots.txt` y las imagenes porque `public/` se copia sola. Nada avisaba, que es la
peor forma de fallar.

## El prerenderizado no usa navegador

`prerender.mjs` renderiza cada ruta con React en el servidor y escribe el HTML. Antes abria Chromium
y guardaba el DOM: funcionaba en un portatil y no aca. La imagen de construccion de Vercel no trae
las librerias de sistema que Chromium necesita y fallaba con `libnspr4.so: cannot open shared object
file`, que no se pueden instalar sin permisos de administrador. El despliegue salia en verde y las
cuatro guias devolvian 404, sin que nada avisara.

Renderizando con React no hay navegador que instalar, funciona en cualquier parte y se ahorran
95 MB de descarga en cada build.

Como los efectos no corren al renderizar en el servidor, el `<head>` de cada ruta se arma aparte,
desde `src/seo/paginas.js`. Esa tabla la leen el prerenderizado y el navegador, asi que un titulo no
puede quedar distinto en el HTML servido y en la pagina ya cargada.

El HTML servido NO se hidrata: el navegador vuelve a montar la aplicacion encima. Eso evita toda la
clase de errores por diferencias entre servidor y cliente, al precio de un repintado que no se nota.
Lo que importa para un buscador es que el contenido venga en la respuesta.

## Las rutas

`cleanUrls` hace que `/declaracion-de-renta-2026` sirva `declaracion-de-renta-2026.html`, que es una
de las dos formas que escribe el prerenderizado. Las cinco paginas publicas salen de ahi.

Los `rewrites` son solo para `/consola`, que es una ruta de cliente y no tiene archivo propio. Se
declara explicita en vez de con un comodin: un comodin que mande todo a `index.html` corre el riesgo
de tapar las paginas prerenderizadas, que es exactamente el bug que se corrigio al escribir las dos
formas de cada URL.

## Variables de entorno

| Variable | Para que | Si falta |
|---|---|---|
| `VITE_WHATSAPP` | El numero al que escribe el boton principal. Solo digitos, con indicativo. | El boton lleva a la guia en vez de abrir la conversacion. El build avisa. |
| `VITE_SITIO_URL` | El dominio, para canonicas, sitemap y tarjetas al compartir. | Toma `https://declaras.co`. |
| `VITE_SUPABASE_URL` | El proyecto de Supabase contra el que se valida al contador. Va como `https://<ref>.supabase.co`, sin ruta. | La consola no puede iniciar sesion. El build avisa. |
| `VITE_SUPABASE_ANON_KEY` | La llave publica del mismo proyecto. Es publica a proposito: la reja de verdad esta en el backend. | Igual que la anterior. |

## Como saber si el despliegue sirvio

`pnpm run produccion` pide cada ruta al dominio publicado y comprueba tres cosas: que responda 200,
que el titulo sea el suyo y no el de la portada, y que el HTML traiga contenido sin ejecutar
JavaScript. Un despliegue en verde no dice nada de eso, y ya paso dos veces que saliera bien y el
sitio quedara mal: una con las guias devolviendo 404 y otra con las paginas vacias.

## Despues de desplegar

Verificar el dominio en Search Console y enviar `https://declaras.co/sitemap.xml`, que se regenera
en cada build con las fechas reales de los archivos.
