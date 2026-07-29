/** Hooks de datos: carga, error y recarga, sin traer una libreria entera para eso. */

import { useCallback, useEffect, useState } from "react";

/**
 * Ejecuta una consulta a la API y expone su estado.
 * `deps` controla cuando se vuelve a pedir; `reload` permite forzarlo tras una accion.
 */
/**
 * Lee datos de la API, con una distincion que importa: CARGAR NO ES REFRESCAR.
 *
 * `loading` es solo la primera vez, cuando todavia no hay nada que mostrar. Un refresco
 * posterior deja los datos viejos a la vista mientras llegan los nuevos, y por eso existe
 * `refreshing` aparte.
 *
 * Sin esa distincion, cada `reload()` ponia `loading` en true, el guard de la pantalla
 * (`if (loading) return <Cargando/>`) desmontaba TODO el arbol, y con el se iba el estado de los
 * componentes de adentro: responder una pregunta devolvia al usuario a la primera etapa, porque
 * la navegacion vivia en un componente que se destruia en cada guardado.
 */
export function useApi(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let active = true;
    // La primera vez no hay nada que mostrar y toca esperar; despues, se refresca en sitio.
    if (nonce === 0) setLoading(true);
    else setRefreshing(true);
    setError(null);

    fetcher()
      .then((result) => active && setData(result))
      .catch((err) => active && setError(err))
      .finally(() => {
        if (!active) return;
        setLoading(false);
        setRefreshing(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return { data, error, loading, refreshing, reload };
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
