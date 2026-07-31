/**
 * Genera la imagen de "compartir" y los iconos del sitio.
 *
 * POR QUE SE GENERAN Y NO SE DIBUJAN A MANO: el `<head>` ya declaraba `clara-og.jpg` y el archivo
 * no existia, asi que al compartir el enlace por WhatsApp no salia tarjeta. Y el canal del producto
 * ES WhatsApp, asi que ese era el peor sitio donde tener el enlace pelado. Generarlas desde el
 * codigo mantiene el titular y el precio en un solo lugar: si cambia el precio, se vuelve a correr.
 *
 * Se dibujan con el navegador que ya usa el prerenderizado, asi se aprovechan las mismas fuentes y
 * los mismos colores de la hoja de estilos, sin agregar una dependencia de imagenes.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const VERDE = "#071712";
const MENTA = "#0e9f6e";
const CREMA = "#fbf9f4";

const marca = (tamano) => `
  <svg viewBox="0 0 32 32" width="${tamano}" height="${tamano}" fill="none">
    <g stroke="${MENTA}" stroke-width="3.3" stroke-linecap="round">
      <path d="M16 3.5v5"/><path d="M16 23.5v5"/><path d="M3.5 16h5"/><path d="M23.5 16h5"/>
      <path d="m7.2 7.2 3.5 3.5"/><path d="m21.3 21.3 3.5 3.5"/>
      <path d="m24.8 7.2-3.5 3.5"/><path d="m10.7 21.3-3.5 3.5"/>
    </g>
  </svg>`;

const tarjeta = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500&family=Inter:wght@400;600&display=swap" rel="stylesheet">
<style>
  * { margin:0; box-sizing:border-box; }
  body { width:1200px; height:630px; display:flex; flex-direction:column; justify-content:space-between;
         padding:76px 82px; background:linear-gradient(145deg,#05281e,#071712 60%,#0a2c21);
         color:white; font-family:Inter,sans-serif; }
  .top { display:flex; align-items:center; gap:14px; }
  .top span { font:600 34px/1 Inter,sans-serif; letter-spacing:-.01em; }
  .top i { width:9px; height:9px; border-radius:50%; background:${MENTA}; display:inline-block; margin-left:2px; }
  h1 { font:500 82px/1.04 Fraunces,serif; letter-spacing:-.02em; max-width:940px; }
  h1 em { color:#9ae6c4; font-style:italic; }
  .pie { display:flex; align-items:center; gap:18px; }
  .chip { padding:13px 22px; border:1px solid rgba(255,255,255,.2); border-radius:999px;
          font:600 24px/1 Inter,sans-serif; color:rgba(255,255,255,.9); }
  .chip.fuerte { background:${MENTA}; border-color:${MENTA}; color:white; }
</style></head><body>
  <div class="top">${marca(46)}<span>Clara<i></i></span></div>
  <h1>Tu declaración de renta<br>por <em>$50.000</em></h1>
  <div class="pie">
    <div class="chip fuerte">Todo por WhatsApp</div>
    <div class="chip">Te decimos gratis si debes declarar</div>
  </div>
</body></html>`;

/** Una tarjeta por pagina: compartir un articulo con el anuncio de la portada desperdicia el clic. */
const conTitular = (titular, chipFuerte, chip) =>
  tarjeta
    .replace("<h1>Tu declaración de renta<br>por <em>$50.000</em></h1>", `<h1>${titular}</h1>`)
    .replace(
      '<div class="chip fuerte">Todo por WhatsApp</div>\n    <div class="chip">Te decimos gratis si debes declarar</div>',
      `<div class="chip fuerte">${chipFuerte}</div>\n    <div class="chip">${chip}</div>`,
    );

/**
 * La tarjeta de la guia. Va aparte porque compartir el articulo con el anuncio de la portada
 * desperdicia el clic: quien recibe el enlace no viene por el precio, viene por la fecha.
 */
const tarjetaGuia = conTitular(
  "Declaración de renta 2026<br><em>fechas por cédula</em> y topes",
  "Del 12 de agosto al 26 de octubre",
  "Los topes en pesos, no en UVT",
);

const icono = (lado) => `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;box-sizing:border-box}
  body{width:${lado}px;height:${lado}px;display:grid;place-items:center;background:${VERDE}}
</style></head><body>${marca(Math.round(lado * 0.62))}</body></html>`;

mkdirSync("public", { recursive: true });
const navegador = await chromium.launch();

const pintar = async (html, ancho, alto, salida, tipo = "png", calidad = undefined) => {
  const pagina = await navegador.newPage({ viewport: { width: ancho, height: alto } });
  await pagina.setContent(html, { waitUntil: "networkidle" });
  await pagina.waitForTimeout(600);
  const buffer = await pagina.screenshot({ type: tipo, quality: calidad });
  writeFileSync(salida, buffer);
  console.log(`  ${salida}  ${Math.round(buffer.length / 1024)} kB`);
  await pagina.close();
};

await pintar(tarjeta, 1200, 630, "public/clara-og.jpg", "jpeg", 88);
await pintar(tarjetaGuia, 1200, 630, "public/clara-og-renta-2026.jpg", "jpeg", 88);

for (const [archivo, titular, fuerte, suave] of [
  [
    "clara-og-sancion.jpg",
    "Sanción por no declarar<br><em>cuánto es de verdad</em>",
    "Mínima de $523.740 en 2026",
    "Hay sanción incluso sin impuesto a pagar",
  ],
  [
    "clara-og-deducciones.jpg",
    "Deducciones de renta<br>y <em>el límite del 40%</em>",
    "Los topes en pesos",
    "Por qué sumar beneficios no siempre baja el impuesto",
  ],
  [
    "clara-og-paso-a-paso.jpg",
    "Cómo declarar renta<br><em>paso a paso</em>",
    "Siete pasos",
    "Y lo que sale mal en cada uno",
  ],
]) {
  await pintar(conTitular(titular, fuerte, suave), 1200, 630, `public/${archivo}`, "jpeg", 88);
}
await pintar(icono(180), 180, 180, "public/apple-touch-icon.png");
await pintar(icono(512), 512, 512, "public/icono-512.png");

// El favicon vectorial pesa nada y se ve nitido en cualquier tamano, incluido el que Google
// muestra al lado del resultado en telefono.
writeFileSync(
  "public/favicon.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="${VERDE}"/>
  <g stroke="${MENTA}" stroke-width="3" stroke-linecap="round" transform="translate(3.2 3.2) scale(0.8)">
    <path d="M16 3.5v5"/><path d="M16 23.5v5"/><path d="M3.5 16h5"/><path d="M23.5 16h5"/>
    <path d="m7.2 7.2 3.5 3.5"/><path d="m21.3 21.3 3.5 3.5"/>
    <path d="m24.8 7.2-3.5 3.5"/><path d="m10.7 21.3-3.5 3.5"/>
  </g>
</svg>`,
);
console.log("  public/favicon.svg");

writeFileSync(
  "public/site.webmanifest",
  JSON.stringify(
    {
      name: "Clara",
      short_name: "Clara",
      description: "Tu declaración de renta por WhatsApp, por $50.000",
      lang: "es-CO",
      start_url: "/",
      display: "standalone",
      background_color: CREMA,
      theme_color: VERDE,
      icons: [
        { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
        { src: "/icono-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
      ],
    },
    null,
    2,
  ) + "\n",
);
console.log("  public/site.webmanifest");

await navegador.close();
