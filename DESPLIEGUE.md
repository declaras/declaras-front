# Despliegue

El sitio se publica en Vercel desde la rama `main`. La configuracion vive en `vercel.json`, que no
admite comentarios porque Vercel lo valida contra un esquema estricto y rechaza cualquier clave que
no conozca. Por eso las razones estan aca.

## Por que hace falta declarar el build

Sin `vercel.json`, Vercel detectaba Vite y corria `vite build` a secas. El despliegue salia en verde
y la portada se veia bien, pero las cuatro guias y el sitemap devolvian 404: ni `sitemap.mjs` ni
`prerender.mjs` llegaban a ejecutarse. La portada funcionaba porque su HTML es el `index.html` del
repositorio, y `robots.txt` y las imagenes porque `public/` se copia sola. Nada avisaba, que es la
peor forma de fallar.

## El navegador del prerenderizado

`prerender.mjs` abre cada ruta en un navegador real y guarda el HTML resultante. Ese navegador NO
viene con el paquete de npm: vive en una cache aparte, asi que `pnpm install` lo deja fuera. Por eso
el `installCommand` lo descarga.

`PLAYWRIGHT_BROWSERS_PATH=0` lo instala dentro de `node_modules` en vez de en la cache del usuario,
que es lo que garantiza que siga ahi cuando corre el build.

El `|| true` del final es a proposito: si la descarga falla, el despliegue continua. El
prerenderizado detecta que no hay navegador, avisa y publica el sitio como aplicacion de cliente.
Para quien entra sigue funcionando; lo que se pierde es el HTML servido, y el aviso queda en el log.

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

## Despues de desplegar

Verificar el dominio en Search Console y enviar `https://declaras.co/sitemap.xml`, que se regenera
en cada build con las fechas reales de los archivos.
