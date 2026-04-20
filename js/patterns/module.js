/**
 * module.js
 * Patrón Module — encapsula la lógica central de asignación y contingencia,
 * exponiendo solo una API pública inmutable.
 */

import { observer } from './observer.js';
import { store } from '../core/store.js';

/** Lista canónica de los 22 integrantes del grupo. */
const MIEMBROS = Object.freeze([
  'Alisson Paola Jaramillo Echeverry',
  'Carlos Andrés Zuluaga Atehortua',
  'Daniela Zapata López',
  'David Antonio Pescador Durán',
  'David Buendia Ruiz',
  'Eric Daniel Barreto Chavez',
  'Jhoan Steven Murillo García',
  'Jhon Alejandro Patiño Agudelo',
  'Juan Camilo Valencia Rey',
  'Juan Carlos Combita Sandoval',
  'Juan David Ferrer Castillo',
  'Juan José Santamaria Muñoz',
  'Julián David Flórez Vera',
  'Maria Fernanda Huertas Montes',
  'Nelson Fabián Gallego Sánchez',
  'Santiago Moreno Piedrahita',
  'Santiago Palacio Tovar',
  'Santiago Tovar Zambrano',
  'Sebastian Ortega Barrero',
  'Stiven Andrés Robles Galán',
  'Valeria Arcila Hernández',
  'Valeria Becerra Giraldo',
]);

/** Nombres de los días en orden canónico. */
const DIAS = Object.freeze(['lunes', 'martes', 'miercoles', 'jueves', 'viernes']);

/**
 * Mezcla un array usando el algoritmo Fisher-Yates y retorna un nuevo array.
 * @param {Array} arr
 * @returns {Array}
 */
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Obtiene el número ISO de semana de una fecha.
 * @param {Date} date
 * @returns {string} Formato YYYY-Www
 */
const getISOWeek = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
};

/**
 * Divide aleatoriamente los 22 miembros en 5 grupos: 2 grupos de 5 y 3 grupos de 4.
 * @returns {Object} Objeto con claves lunes…viernes, cada una con un array de nombres.
 */
const distribuirGrupos = () => {
  const mezclados = shuffle(MIEMBROS);
  // 2 grupos de 5 y 3 grupos de 4 → índices [0,5), [5,10), [10,14), [14,18), [18,22)
  const tamaños = [5, 5, 4, 4, 4];
  return DIAS.reduce((acc, dia, i) => {
    const inicio = tamaños.slice(0, i).reduce((s, n) => s + n, 0);
    return { ...acc, [dia]: mezclados.slice(inicio, inicio + tamaños[i]) };
  }, {});
};

/**
 * Selecciona un candidato aleatorio de un array.
 * @param {string[]} pool
 * @returns {string|null}
 */
const elegirAleatorio = (pool) =>
  pool.length === 0 ? null : pool[Math.floor(Math.random() * pool.length)];

/**
 * Calcula el pool válido de reemplazantes para un día dado.
 * @param {string} dia
 * @param {Object} grupos
 * @param {Object} reemplazos - { dia: [reemplazante, ...] }
 * @returns {string[]}
 */
const calcularPool = (dia, grupos, reemplazos) => {
  const asignadosDia = new Set(grupos[dia] ?? []);
  const reemplazantesActivos = new Set(
    Object.entries(reemplazos)
      .filter(([d]) => d === dia)
      .flatMap(([, obj]) => Object.values(obj).filter(Boolean))
  );
  return MIEMBROS.filter(
    m => !asignadosDia.has(m) && !reemplazantesActivos.has(m)
  );
};

// ─── API PÚBLICA ────────────────────────────────────────────────────────────

/**
 * Inicializa o carga el estado de la semana actual desde el store.
 * Si no existen datos, genera la distribución aleatoria.
 */
const inicializar = () => {
  const semanaActual = getISOWeek(new Date());
  const estadoGuardado = store.cargar();

  if (!estadoGuardado || estadoGuardado.semana !== semanaActual) {
    const nuevoEstado = {
      semana: semanaActual,
      grupos: distribuirGrupos(),
      ausentes: [],
      reemplazos: {},
    };
    store.guardar(nuevoEstado);
    observer.publish('estado:actualizado', nuevoEstado);
  } else {
    observer.publish('estado:actualizado', estadoGuardado);
  }
};

/**
 * Marca una persona como ausente y busca un reemplazante válido.
 * @param {string} nombre - Nombre del miembro a marcar ausente.
 * @param {string} dia - Día de la semana al que pertenece.
 */
const marcarAusente = (nombre, dia) => {
  const estado = store.cargar();
  if (!estado) return;

  const yaAusente = estado.ausentes.includes(nombre);
  if (yaAusente) return;

  const pool = calcularPool(dia, estado.grupos, estado.reemplazos);
  const reemplazante = elegirAleatorio(pool);

  const reemplazosDelDia = estado.reemplazos[dia] ?? {};

  const nuevoEstado = {
    ...estado,
    ausentes: [...estado.ausentes, nombre],
    reemplazos: {
      ...estado.reemplazos,
      [dia]: {
        ...reemplazosDelDia,
        [nombre]: reemplazante ?? null,
      },
    },
  };

  store.guardar(nuevoEstado);
  observer.publish('estado:actualizado', nuevoEstado);

  if (!reemplazante) {
    observer.publish('reemplazo:sinCandidatos', { dia });
  }
};

/**
 * Revierte la ausencia de una persona y elimina su reemplazante asignado.
 * @param {string} nombre - Nombre del miembro a reincorporar.
 * @param {string} dia - Día de la semana al que pertenece.
 */
const revertirAusencia = (nombre, dia) => {
  const estado = store.cargar();
  if (!estado) return;

  const reemplazosDelDia = { ...(estado.reemplazos[dia] ?? {}) };
  delete reemplazosDelDia[nombre];

  const nuevoEstado = {
    ...estado,
    ausentes: estado.ausentes.filter(a => a !== nombre),
    reemplazos: { ...estado.reemplazos, [dia]: reemplazosDelDia },
  };

  store.guardar(nuevoEstado);
  observer.publish('estado:actualizado', nuevoEstado);
};

/**
 * Genera una nueva distribución aleatoria para la semana actual.
 */
const nuevaSemana = () => {
  const nuevoEstado = {
    semana: getISOWeek(new Date()),
    grupos: distribuirGrupos(),
    ausentes: [],
    reemplazos: {},
  };
  store.guardar(nuevoEstado);
  observer.publish('estado:actualizado', nuevoEstado);
};

/**
 * Resetea completamente el estado: limpia localStorage y genera una nueva distribución.
 */
const resetear = () => {
  store.limpiar();
  inicializar();
};

/** Retorna una copia del estado actual sin exponer referencias mutables. */
const obtenerEstado = () => {
  const estado = store.cargar();
  return estado ? { ...estado } : null;
};

export const aseoModule = Object.freeze({
  inicializar,
  marcarAusente,
  revertirAusencia,
  nuevaSemana,
  resetear,
  obtenerEstado,
  DIAS,
  MIEMBROS,
});
