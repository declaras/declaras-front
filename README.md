# declaras-front

Frontend de declaras. Dos aplicaciones con audiencias distintas, un solo sistema de diseño:

| Ruta | Qué es | Audiencia |
|---|---|---|
| `/` | Sitio público de Clara | Un contribuyente que decide si nos contrata |
| `/consola` | Consola del contador | Uso interno: revisar y trabajar expedientes |

Comparten los tokens (crema `#fbf9f4`, verde marca `#0e9f6e`, semáforo, Fraunces + Inter),
no el layout: el sitio público respira porque tiene que persuadir, y la consola es densa
porque alguien revisa decenas de expedientes al día y necesita ver mucho de un vistazo.

El backend vive en [declaras/declaras](https://github.com/declaras/declaras).

## Correr en desarrollo

```bash
pnpm install
cp .env.example .env      # apunta al backend y define la llave de API
pnpm dev                  # http://localhost:5173/consola
```

El backend tiene que estar arriba (`make api` en el repo del backend). El proxy de Vite
reenvía `/api` al backend **inyectando la llave**, así que el navegador nunca la tiene. En
producción ese papel lo cumple un gateway o un BFF, no este proxy.

## Qué muestra la consola

**Lista de expedientes.** Cliente, año gravable, estado y última actividad, con métricas
arriba y el formulario para abrir un expediente nuevo.

**Detalle del expediente**, que es la pantalla de trabajo:

- **Acciones.** Consultar la DIAN (pide la clave del cliente en el momento, la manda al
  backend y no la guarda en ninguna parte) y subir un documento que el cliente envió.
- **Por revisar.** Los flags del expediente con una explicación en lenguaje llano de qué
  significa cada código, y el botón para marcarlos revisados con una nota.
- **¿Está obligado a declarar?** Los cinco topes con lo que la DIAN reporta contra el
  límite legal del año, para poder explicar el veredicto en vez de solo afirmarlo.
- **Renglones del formulario 210.** El agregado de lo que la propia DIAN asignó a cada
  casilla. No es un cálculo del impuesto y la pantalla lo dice.
- **Facturas electrónicas** con la base de la deducción del 1%.
- **Documentos.** Cada uno con su origen (portal o subido por el cliente), si está leído, y
  al abrirlo, los valores extraídos **con la celda de la que salió cada uno** (`C8`, `F15`),
  para que un contador pueda auditar sin abrir el archivo.
- **Bitácora.** Lo que pasó en el expediente, en orden inverso.

## Estructura

```
src/
  App.jsx           sitio publico (prototipo de marketing)
  consola/
    Consola.jsx           cascaron: navegacion y estado del servicio
    ListaExpedientes.jsx  lista + alta de expedientes y clientes
    DetalleExpediente.jsx pantalla de trabajo, acciones y bitacora
    Resumen.jsx           obligacion, renglones del 210 y facturas
    Documentos.jsx        documentos y su lectura estructurada
    Pendientes.jsx        flags y su resolucion
    api.js                cliente HTTP; los errores conservan el codigo del backend
    hooks.js              carga, error y recarga
    formato.js            pesos, fechas y nombres legibles de campos y tipos
    consola.css           estilos, sobre los tokens de styles.css
```

## Notas

- Los errores de la API conservan el `code` estable que devuelve el backend
  (`TAXPAYER_MISMATCH`, `DOCUMENT_UNREADABLE`), así que la UI puede ramificar y el usuario
  ve un mensaje entendible sin perder el dato técnico para reportarlo.
- La consulta a la DIAN es asíncrona en el backend: la consola crea el job, lo sondea
  mostrando el avance, y al terminar lo vincula al expediente.
- Si la DIAN pide verificación de identidad, la consola lo informa como tal. Resolver ese
  reto desde la consola está pendiente.
