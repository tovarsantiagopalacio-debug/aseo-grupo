/**
 * render.js
 * Capa de UI — única responsable de la manipulación del DOM.
 * Se suscribe al observer y reacciona a los cambios de estado automáticamente.
 */

import { observer } from '../patterns/observer.js';
import { aseoModule } from '../patterns/module.js';

/** Mapeo genérico por día */
const CONFIG_DIAS = Object.freeze({
  lunes:     { label: 'Lunes' },
  martes:    { label: 'Martes' },
  miercoles: { label: 'Miércoles' },
  jueves:    { label: 'Jueves' },
  viernes:   { label: 'Viernes' },
});

/** Función para obtener un array de fechas formateadas a partir de la semana ISO */
const getDatesFromISOWeek = (isoWeekStr) => {
  const [yearStr, weekStr] = isoWeekStr.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);
  
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dow = simple.getUTCDay();
  const ISOweekStart = simple;
  if (dow <= 4)
    ISOweekStart.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1);
  else
    ISOweekStart.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay());
  
  const dates = [];
  const formatter = new Intl.DateTimeFormat('es-ES', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  for (let i = 0; i < 5; i++) {
    const d = new Date(ISOweekStart);
    d.setUTCDate(d.getUTCDate() + i);
    dates.push(formatter.format(d));
  }
  return dates;
};

/** Función para generar iniciales */
const obtenerIniciales = (nombreCompleto) => {
  const partes = nombreCompleto.split(' ').filter(Boolean);
  if (partes.length >= 2) {
    return (partes[0][0] + partes[1][0]).toUpperCase();
  }
  return partes[0].substring(0, 2).toUpperCase();
};

/**
 * Genera el HTML de un miembro con su estado visual correcto.
 */
const renderMiembro = (nombre, dia, ausentes, reemplazos) => {
  const esAusente = ausentes.includes(nombre);
  const clase = esAusente ? 'absent' : '';
  const iniciales = obtenerIniciales(nombre);
  
  const avatar = esAusente 
    ? `<div class="avatar"><span class="material-symbols-outlined">close</span></div>`
    : `<div class="avatar">${iniciales}</div>`;

  const accion = esAusente
    ? `<button class="btn-action btn-revertir" data-nombre="${nombre}" data-dia="${dia}" title="Reincorporar" aria-label="Reincorporar"><span class="material-symbols-outlined">undo</span></button>`
    : `<button class="btn-action btn-ausente" data-nombre="${nombre}" data-dia="${dia}" title="Marcar ausente" aria-label="Marcar ausente"><span class="material-symbols-outlined">close</span></button>`;

  return `
    <div class="member-card ${clase}" data-nombre="${nombre}">
      <div class="member-info">
        ${avatar}
        <div class="member-details">
          <span class="member-name">${nombre}</span>
        </div>
      </div>
      ${accion}
    </div>`;
};

/**
 * Genera el HTML de un reemplazante.
 */
const renderReemplazante = (nombre, dia, reemplazado) => `
  <div class="member-card replacement" data-nombre="${nombre}">
    <div class="member-info">
      <div class="avatar"><span class="material-symbols-outlined">sync_alt</span></div>
      <div class="member-details">
        <span class="member-name">${nombre}</span>
        <span class="member-role old">${reemplazado}</span>
        <span class="badge">Reemplazo</span>
      </div>
    </div>
  </div>`;

/**
 * Genera el HTML completo de la tarjeta de un día.
 */
const renderTarjetaDia = (dia, miembros, ausentes, reemplazos, fecha) => {
  const config = CONFIG_DIAS[dia];
  
  const reemplazosDelDia = Object.entries(reemplazos[dia] ?? {})
    .filter(([, rep]) => rep !== null);

  const listaMiembros = miembros
    .map(m => renderMiembro(m, dia, ausentes, reemplazos))
    .join('');

  const listaReemplazantes = reemplazosDelDia
    .map(([ausente, rep]) => renderReemplazante(rep, dia, ausente))
    .join('');

  return `
    <div class="day-card">
      <div class="day-accent ${dia}"></div>
      <div class="day-header">
        <h2 class="day-title">${config.label}</h2>
        <p class="day-date">${fecha}</p>
      </div>
      <div class="day-body">
        ${listaMiembros}
        ${listaReemplazantes}
      </div>
    </div>`;
};

/**
 * Renderiza todos los grupos en el contenedor principal del DOM.
 */
const renderGrupos = (estado) => {
  const contenedor = document.getElementById('grupos-container');
  if (!contenedor) return;

  const { grupos, ausentes, reemplazos, semana } = estado;
  const fechas = getDatesFromISOWeek(semana);

  const htmlTarjetas = aseoModule.DIAS
    .map((dia, idx) => renderTarjetaDia(dia, grupos[dia] ?? [], ausentes, reemplazos, fechas[idx]))
    .join('');

  contenedor.innerHTML = htmlTarjetas;

  // Actualizar subtítulo con la semana actual
  const semanaEl = document.getElementById('semana-display');
  if (semanaEl) {
    const [, weekStr] = semana.split('-W');
    semanaEl.textContent = `Semana ${weekStr} • ${fechas[0]} - ${fechas[4]}`;
  }

  // Calcular estadísticas
  const totalPersonal = aseoModule.MIEMBROS.length;
  let totalReemplazos = 0;
  aseoModule.DIAS.forEach(d => {
    totalReemplazos += Object.values(reemplazos[d] ?? {}).filter(Boolean).length;
  });
  const totalAusencias = ausentes.length;

  const statsEl = document.getElementById('header-stats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="stat-card">
        <span class="stat-label">Total Personal</span>
        <span class="stat-value primary">${totalPersonal}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Reemplazos</span>
        <span class="stat-value tertiary">${totalReemplazos}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Ausencias</span>
        <span class="stat-value error">${totalAusencias}</span>
      </div>
    `;
  }

  adjuntarEventos(contenedor);
};

/**
 * Muestra un toast de notificación temporal en la UI.
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
