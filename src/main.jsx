import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import App from "./App";
import Consola from "./consola/Consola";
import "./styles.css";

/**
 * Dos aplicaciones en un mismo front, con audiencias distintas:
 *   /         el sitio publico de Clara (persuadir a un contribuyente)
 *   /consola  la consola del contador (herramienta de trabajo interna)
 * Comparten los tokens del sistema de diseno, no el layout.
 */
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/consola/*" element={<Consola />} />
        <Route path="*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
