/** Hooks de datos: carga, error y recarga, sin traer una libreria entera para eso. */

import { useCallback, useEffect, useState } from "react";

/**
 * Lee datos de la API, con una distincion que importa: CARGAR NO ES REFRESCAR.
 *
 * `loading` es solo la primera vez, cuando todavia no hay nada que mostrar. Un refresco posterior
 * deja los datos viejos a la vista mientras llegan los nuevos, y por eso existe `refreshing` aparte.
 *
 * Sin esa distincion, cada `reload()` ponia `loading` en true, el guard de la pantalla
 * (`if (loading) return <Cargando/>`) desmontaba TODO el arbol, y con el se iba el estado de los
 * componentes de adentro: responder una pregunta devolvia al usuario a la primera etapa, porque la
 * navegacion vivia en un componente que se destruia en cada guardado.
 *
 * LOS DOS ESTADOS SE DERIVAN, NO SE SETEAN, y eso es el arreglo de la version anterior. Antes habia
 * cuatro `useState` (`data`, `error`, `loading`, `refreshing`) coordinados a mano, y el efecto
 * arrancaba llamando `setLoading(true)` o `setRefreshing(true)` de forma sincrona: un render extra
 * en cada pedido, y cuatro piezas que pueden quedar en combinaciones que no significan nada (por
 * ejemplo `loading` y `refreshing` a la vez).
 *
 * Ahora hay dos: el `nonce` que se pide y el `resultado` que llego, con el nonce que lo produjo.
 * Que haya algo en curso es "el resultado que tengo no es del pedido que hice", que se compara; y
 * si eso es una primera carga o un refresco es "ya llego algo alguna vez", que tambien se compara.
 * El efecto no toca estado hasta que la respuesta existe.
 */
export function useApi(fetcher, deps = []) {
  const [nonce, setNonce] = useState(0);
  // `nonce: -1` es "todavia no ha llegado nada", que es distinto de "llego y venia vacio".
  const [resultado, setResultado] = useState({ nonce: -1, data: null, error: null });

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let active = true;
    const pedido = nonce;

    fetcher()
      .then((data) => active && setResultado({ nonce: pedido, data, error: null }))
      .catch((error) =>
        active &&
        // La data anterior se conserva: un refresco que falla no tiene por que borrar de la
        // pantalla lo que ya se estaba mostrando. Se ve la tabla de antes con el aviso del error,
        // que es mas util que una pantalla vacia.
        setResultado((previo) => ({ nonce: pedido, data: previo.data, error })),
      );

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const enCurso = resultado.nonce !== nonce;

  return {
    data: resultado.data,
    error: resultado.error,
    loading: enCurso && resultado.nonce < 0,
    refreshing: enCurso && resultado.nonce >= 0,
    reload,
  };
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
