import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * YA NO HAY PROXY DE DESARROLLO, y su ausencia es el punto.
 *
 * Habia uno que inyectaba `X-API-Key` en cada peticion a `/api`, para que la llave no bajara al
 * navegador. Esa llave se fue: el navegador ahora manda el token de la persona que entro, que es una
 * credencial que SI le pertenece y que no hay que esconderle.
 *
 * El front le habla directo al backend con `VITE_API_URL`, en desarrollo igual que en produccion.
 * Un proxy en medio ocultaria justo lo que conviene ver mientras se programa: si CORS esta bien
 * configurado, si la cabecera `Authorization` llega, si el preflight pasa. Con proxy todo eso
 * funciona en local y falla al desplegar.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
