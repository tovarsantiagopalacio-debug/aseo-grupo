/**
 * observer.js
 * Patrón Observer (Pub/Sub) — gestiona suscriptores y notificaciones de cambio de estado.
 */

const createObserver = () => {
  /** @type {Map<string, Set<Function>>} Mapa de eventos a conjuntos de callbacks */
  const listeners = new Map();

  /** Suscribe un callback a un evento dado. @param {string} event @param {Function} cb */
  const subscribe = (event, cb) => {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(cb);
    return () => listeners.get(event).delete(cb); // devuelve unsubscribe
  };

  /** Notifica a todos los suscriptores de un evento con el payload dado. @param {string} event @param {*} payload */
  const publish = (event, payload) => {
    if (!listeners.has(event)) return;
    listeners.get(event).forEach(cb => cb(payload));
  };

  /** Elimina todos los suscriptores de un evento. @param {string} event */
  const clear = (event) => listeners.delete(event);

  return Object.freeze({ subscribe, publish, clear });
};

/** Instancia global del observer compartida por toda la aplicación. */
export const observer = createObserver();
