/**
 * render.js
 * Capa de UI — única responsable de la manipulación del DOM.
 * Se suscribe al observer y reacciona a los cambios de estado automáticamente.
 */

import { observer } from '../patterns/observer.js';
import { aseoModule } from '../patterns/module.js';

/** Mapeo de día → metadatos visuales. */
const CONFIG_DIAS = Object.freeze({
  lunes:     { label: 'Lunes',     emoji: '☀️',  colorVar: '--color-lunes' },
  martes:    { label: 'Martes',    emoji: '🌿',  colorVar: '--color-martes' },
  miercoles: { label: 'Miércoles', emoji: '💜',  colorVar: '--color-miercoles' },
  jueves:    { label: 'Jueves',    emoji: '⚙️',  colorVar: '--color-jueves' },
  viernes:   { label: 'Viernes',   emoji: '⭐',  colorVar: '--color-viernes' },
});

/**
 * Genera el HTML de un miembro con su estado visual correcto.
 * @param {string} nombre
 * @param {string} dia
 * @param {string[]} ausentes
 * @param {Object} reemplazos - { dia: [reemplazante, ...] }
 * @returns {string} HTML string del miembro.
 */
const renderMiembro = (nombre, dia, ausentes, reemplazos) => {
  const esAusente = ausentes.includes(nombre);
  const clase = esAusente ? 'ausente' : 'activo';
  const iconoAusente = esAusente ? '<span class="icono-ausente" aria-label="Ausente">✗</span>' : '';
  const accion = esAusente
    ? `<button class="btn-revertir" data-nombre="${nombre}" data-dia="${dia}" title="Reincorporar" aria-label="Reincorporar a ${nombre}">↩ Reincorporar</button>`
    : `<button class="btn-ausente" data-nombre="${nombre}" data-dia="${dia}" title="Marcar ausente" aria-label="Marcar ausente a ${nombre}">✗ Ausente</button>`;

  return `
    <li class="miembro ${clase}" data-nombre="${nombre}">
      <span class="miembro-nombre">${iconoAusente}${nombre}</span>
      ${accion}
    </li>`;
};

/**
 * Genera el HTML de un reemplazante con su badge distintivo.
 * @param {string} nombre
 * @param {string} dia
 * @returns {string} HTML string del reemplazante.
 */
const renderReemplazante = (nombre, dia) => `
  <li class="miembro reemplazado" data-nombre="${nombre}">
    <span class="miembro-nombre">
      <span class="badge-reemplazo" aria-label="Reemplazante">⇄</span>
      ${nombre}
    </span>
    <span class="tag-reemplazo">Reemplazo</span>
  </li>`;

/**
 * Genera el HTML completo de la tarjeta de un día.
 * @param {string} dia
 * @param {string[]} miembros
 * @param {string[]} ausentes
 * @param {Object} reemplazos
 * @returns {string} HTML string de la tarjeta del día.
 */
const renderTarjetaDia = (dia, miembros, ausentes, reemplazos) => {
  const config = CONFIG_DIAS[dia];
  const reemplazantesDelDia = Object.entries(reemplazos[dia] ?? {})
    .filter(([, rep]) => rep !== null)
    .map(([, rep]) => rep);

  const listaMiembros = miembros
    .map(m => renderMiembro(m, dia, ausentes, reemplazos))
    .join('');

  const listaReemplazantes = reemplazantesDelDia
    .map(r => renderReemplazante(r, dia))
    .join('');

  return `
    <article class="tarjeta-dia tarjeta-${dia}" aria-label="Turno ${config.label}">
      <header class="tarjeta-header">
        <span class="dia-emoji" aria-hidden="true">${config.emoji}</span>
        <h2 class="dia-nombre">${config.label}</h2>
        <span class="dia-count">${miembros.length} personas</span>
      </header>
      <ul class="lista-miembros" role="list">
        ${listaMiembros}
        ${listaReemplazantes}
      </ul>
    </article>`;
};

/**
 * Renderiza todos los grupos en el contenedor principal del DOM.
 * @param {Object} estado - Estado completo de la aplicación.
 */
const renderGrupos = (estado) => {
  const contenedor = document.getElementById('grupos-container');
  if (!contenedor) return;

  const { grupos, ausentes, reemplazos, semana } = estado;

  const htmlSemana = `<span class="semana-badge">📅 Semana ${semana}</span>`;
  const htmlTarjetas = aseoModule.DIAS
    .map(dia => renderTarjetaDia(dia, grupos[dia] ?? [], ausentes, reemplazos))
    .join('');

  contenedor.innerHTML = htmlTarjetas;

  const semanaEl = document.getElementById('semana-display');
  if (semanaEl) semanaEl.innerHTML = htmlSemana;

  adjuntarEventos(contenedor);
};

/**
 * Muestra un toast de notificación temporal en la UI.
 * @param {string} mensaje
 * @param {'info'|'warn'|'error'} tipo
 */
const mostrarToast = (mensaje, tipo = 'info') => {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = mensaje;
  toast.className = `toast toast--${tipo} toast--visible`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('toast--visible'), 4000);
};

/**
 * Adjunta los event listeners de interacción a los botones del DOM renderizado.
 * @param {HTMLElement} contenedor
 */
const adjuntarEventos = (contenedor) => {
  contenedor.querySelectorAll('.btn-ausente').forEach(btn => {
    btn.addEventListener('click', () => {
      const { nombre, dia } = btn.dataset;
      aseoModule.marcarAusente(nombre, dia);
    });
  });

  contenedor.querySelectorAll('.btn-revertir').forEach(btn => {
    btn.addEventListener('click', () => {
      const { nombre, dia } = btn.dataset;
      aseoModule.revertirAusencia(nombre, dia);
    });
  });
};

/**
 * Inicializa las suscripciones del Observer para esta capa de UI.
 */
const initRender = () => {
  observer.subscribe('estado:actualizado', renderGrupos);
  observer.subscribe('reemplazo:sinCandidatos', ({ dia }) => {
    const config = CONFIG_DIAS[dia] ?? { label: dia };
    mostrarToast(`⚠️ Sin reemplazos disponibles para el ${config.label}.`, 'warn');
  });
};

export const render = Object.freeze({ initRender, mostrarToast });
