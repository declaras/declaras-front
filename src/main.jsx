import React, { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import "./styles.css";

/**
 * La consola y la guia se cargan aparte.
 *
 * POR QUE: eran un solo paquete de 390 kB, asi que quien llegaba a la guia desde un buscador
 * descargaba tambien las cinco pantallas del prototipo y toda la consola del contador, que no va a
 * abrir nunca. El tiempo de carga es un factor de posicionamiento y esa pagina es justamente la que
 * entra por busqueda, asi que es donde mas duele.
 */
const App = lazy(() => import("./App"));
const Consola = lazy(() => import("./consola/Consola"));
const GuiaRenta2026 = lazy(() => import("./contenido/GuiaRenta2026"));
const SancionRenta = lazy(() => import("./contenido/SancionRenta"));
const Deducciones = lazy(() => import("./contenido/Deducciones"));
const PasoAPaso = lazy(() => import("./contenido/PasoAPaso"));

/**
 * Dos aplicaciones en un mismo front, con audiencias distintas:
 *   /                            el sitio publico de Clara (persuadir a un contribuyente)
 *   /declaracion-de-renta-2026   la guia, que es la pagina principal del tema
 *   /sancion-por-no-declarar-renta, /deducciones-declaracion-de-renta y
 *   /como-declarar-renta-paso-a-paso   las tres que responden consultas con su propia demanda
 *   /consola                     la consola del contador (herramienta de trabajo interna)
 * Comparten los tokens del sistema de diseno, no el layout.
 */
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/consola/*" element={<Consola />} />
          <Route path="/declaracion-de-renta-2026" element={<GuiaRenta2026 />} />
          <Route path="/sancion-por-no-declarar-renta" element={<SancionRenta />} />
          <Route path="/deducciones-declaracion-de-renta" element={<Deducciones />} />
          <Route path="/como-declarar-renta-paso-a-paso" element={<PasoAPaso />} />
          <Route path="*" element={<App />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>,
);
