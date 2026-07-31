/**
 * Lo minimo que hace falta para que un error de verdad no llegue al navegador.
 *
 * POR QUE SE AGREGO. El proyecto no tenia linter. Vite construye sin quejarse de un import que
 * quedo sin uso, de una variable que se declara y no se lee, o de una que se usa sin declarar
 * — y esa ultima es un error en ejecucion, no un detalle de estilo: `profunda is not defined`
 * dejo la etapa de decisiones en blanco y el build habia salido en verde.
 *
 * DOS COSAS QUE SI IMPORTAN AQUI:
 *
 * `no-undef` con los globals del navegador. Es lo que atrapa el caso de arriba.
 *
 * Las reglas de hooks de React. Un hook dentro de un `if` o una dependencia que falta en un
 * `useEffect` no rompen el build y despues se manifiestan como "a veces no se actualiza", que es
 * la clase de bug que cuesta una tarde encontrar.
 *
 * NO se agregan reglas de formato: el formato lo lleva Prettier y discutirlo dos veces no ayuda.
 *
 * TAMPOCO VA `eslint-plugin-react`. Su version publicada (7.37.5) no arranca con ESLint 10: la regla
 * `react/display-name` llama `getFilename` sobre algo que ya no lo tiene y revienta el linter
 * entero. Lo que aportaba eran comprobaciones de JSX y PropTypes, y este proyecto no usa PropTypes;
 * lo que de verdad hacia falta —`no-undef`, `no-unused-vars` y las reglas de hooks— no viene de ahi.
 */

import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  { ignores: ["dist/**", "dist-ssr/**", "node_modules/**"] },
  js.configs.recommended,
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Un argumento sin usar puede ser deliberado (una firma que se respeta); una variable local
      // sin usar no lo es nunca.
      "no-unused-vars": ["error", { args: "none", varsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["scripts/**/*.mjs", "*.config.js"],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    // El prerenderizador corre en Node, pero las funciones que le pasa a `page.evaluate` se
    // ejecutan dentro del navegador. Sin declararlo, `no-undef` marca `document` en un codigo que
    // es correcto, y la unica alternativa seria apagar la regla que precisamente hace falta.
    files: ["scripts/prerender.mjs"],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
];
