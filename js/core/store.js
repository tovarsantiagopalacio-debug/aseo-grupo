/**
 * store.js
 * Capa de persistencia — abstrae el acceso a localStorage con el esquema fijo del proyecto.
 */

/** Clave única usada en localStorage para todo el estado de la aplicación. */
const STORAGE_KEY = 'aseo-grupo-state';

/**
 * Guarda el estado completo de la aplicación en localStorage.
 * @param {Object} estado - Objeto con la estructura canónica del esquema de datos.
 */
const guardar = (estado) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
  } catch (e) {
    console.error('[store] Error al guardar en localStorage:', e);
  }
};

/**
 * Carga y parsea el estado almacenado en localStorage.
 * @returns {Object|null} El estado parseado, o null si no existe o hay error.
 */
const cargar = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const estado = JSON.parse(raw);
    // Migración silenciosa: convierte reemplazos con arrays (esquema antiguo) a objetos vacíos.
    if (estado?.reemplazos) {
      const reemplazosNormalizados = Object.fromEntries(
        Object.entries(estado.reemplazos).map(([dia, val]) => [
          dia,
          Array.isArray(val) ? {} : val,
        ])
      );
      estado.reemplazos = reemplazosNormalizados;
    }
    return estado;
  } catch (e) {
    console.error('[store] Error al cargar desde localStorage:', e);
    return null;
  }
};

/**
 * Elimina completamente el estado almacenado en localStorage.
 */
const limpiar = () => {
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * Comprueba si existe un estado guardado previamente.
 * @returns {boolean}
 */
const existe = () => localStorage.getItem(STORAGE_KEY) !== null;

export const store = Object.freeze({ guardar, cargar, limpiar, existe });
