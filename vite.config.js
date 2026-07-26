import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backend = env.DECLARAS_API_URL ?? "http://127.0.0.1:8000";
  const apiKey = env.DECLARAS_API_KEY ?? "dev-key-cambiar";

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        // El proxy inyecta la llave de API para que el navegador nunca la tenga.
        // En produccion ese papel lo cumple un gateway o un BFF, no este proxy.
        "/api": {
          target: backend,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.setHeader("X-API-Key", apiKey);
            });
          },
        },
      },
    },
  };
});
