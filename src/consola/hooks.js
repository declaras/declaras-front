/** Hooks de datos: carga, error y recarga, sin traer una libreria entera para eso. */

import { useCallback, useEffect, useState } from "react";

/**
 * Ejecuta una consulta a la API y expone su estado.
 * `deps` controla cuando se vuelve a pedir; `reload` permite forzarlo tras una accion.
 */
export function useApi(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetcher()
      .then((result) => active && setData(result))
      .catch((err) => active && setError(err))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return { data, error, loading, reload };
}

/** Estado de una accion disparada por el usuario (guardar, resolver, subir). */
export function useAction(action) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(
    async (...args) => {
      setRunning(true);
      setError(null);
      try {
        return await action(...args);
      } catch (err) {
        setError(err);
        return null;
      } finally {
        setRunning(false);
      }
    },
    [action],
  );

  return { run, running, error };
}
