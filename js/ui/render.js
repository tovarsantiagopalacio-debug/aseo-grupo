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
const getInitials = (nombre) => {
  const partes = nombre.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase();
};

/**
 * Genera el HTML de un miembro con su estado visual correcto.
 */
const renderMiembro = (nombre, dia, ausentes, reemplazos) => {
  const esAusente = ausentes.includes(nombre);
  const clase = esAusente ? 'absent' : '';
  const iniciales = getInitials(nombre);
  
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

const inyectarOverlayFifa = () => {
  if (document.getElementById('fifa-overlay')) return;

  const flash = document.createElement('div');
  flash.id = 'fifa-flash';
  flash.className = 'fifa-flash';

  const overlay = document.createElement('div');
  overlay.id = 'fifa-overlay';
  overlay.className = 'fifa-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Cambio registrado');

  overlay.innerHTML = `
    <div class="fifa-panel" id="fifa-panel">
      <div class="fifa-header">
        <div class="fifa-dot-red"></div>
        <div class="fifa-dot-green"></div>
        <span class="fifa-header-label">Cambio registrado</span>
        <span class="fifa-semana" id="fifa-semana"></span>
      </div>
      <div class="fifa-body">
        <div class="fifa-change-row">
          <div class="fifa-player-card sale" id="fifa-card-out">
            <div class="fifa-avatar sale" id="fifa-avatar-out"></div>
            <div>
              <div class="fifa-player-nombre" id="fifa-nombre-out"></div>
              <div class="fifa-player-sub" id="fifa-dia-out"></div>
            </div>
          </div>
          <div class="fifa-arrow down">↓</div>
        </div>
        <div class="fifa-divider"></div>
        <div class="fifa-change-row">
          <div class="fifa-player-card entra" id="fifa-card-in">
            <div class="fifa-avatar entra" id="fifa-avatar-in"></div>
            <div>
              <div class="fifa-player-nombre" id="fifa-nombre-in"></div>
              <div class="fifa-player-sub">Entra como reemplazo</div>
            </div>
          </div>
          <div class="fifa-arrow up">↑</div>
        </div>
      </div>
      <div class="fifa-footer">
        <span class="fifa-footer-label">Grupo ADSO</span>
        <button class="fifa-btn-cerrar" id="fifa-btn-cerrar">Cerrar ×</button>
      </div>
    </div>
  `;

  document.body.appendChild(flash);
  document.body.appendChild(overlay);

  document.getElementById('fifa-btn-cerrar')
    .addEventListener('click', cerrarAnimacionFifa);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) cerrarAnimacionFifa();
  });
};

const mostrarAnimacionFifa = (nombreSale, diaSale, nombreEntra, semana) => {
  if (!nombreEntra) return;

  const overlay = document.getElementById('fifa-overlay');
  const panel   = document.getElementById('fifa-panel');
  const flash   = document.getElementById('fifa-flash');
  if (!overlay) return;

  document.getElementById('fifa-nombre-out').textContent  = nombreSale;
  document.getElementById('fifa-nombre-in').textContent   = nombreEntra;
  document.getElementById('fifa-avatar-out').textContent  = getInitials(nombreSale);
  document.getElementById('fifa-avatar-in').textContent   = getInitials(nombreEntra);
  document.getElementById('fifa-dia-out').textContent     = `Sale · ${diaSale}`;
  document.getElementById('fifa-semana').textContent      = semana ?? '';

  const cardOut = document.getElementById('fifa-card-out');
  const cardIn  = document.getElementById('fifa-card-in');

  cardOut.style.animation = 'none';
  cardIn.style.animation  = 'none';
  panel.style.animation   = 'none';
  panel.style.opacity     = '0';

  flash.classList.remove('activo');
  void flash.offsetWidth;
  flash.classList.add('activo');

  requestAnimationFrame(() => {
    cardOut.style.animation = '';
    cardIn.style.animation  = '';
    panel.style.animation   = '';
    panel.style.opacity     = '';
    overlay.classList.add('activo');
  });
};

const cerrarAnimacionFifa = () => {
  const overlay = document.getElementById('fifa-overlay');
  if (!overlay) return;
  overlay.classList.remove('activo');
};

/**
 * Adjunta los event listeners de interacción a los botones del DOM renderizado.
 */
const adjuntarEventos = (contenedor) => {
  contenedor.querySelectorAll('.btn-ausente').forEach(btn => {
    btn.addEventListener('click', () => {
      const { nombre, dia } = btn.dataset;
      aseoModule.marcarAusente(nombre, dia);
      const estadoNuevo = aseoModule.obtenerEstado();
      const reemplazante = estadoNuevo?.reemplazos?.[dia]?.[nombre];
      if (reemplazante) {
        mostrarAnimacionFifa(nombre, dia, reemplazante, estadoNuevo.semana);
      }
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
  inyectarOverlayFifa();
  observer.subscribe('estado:actualizado', renderGrupos);
  observer.subscribe('reemplazo:sinCandidatos', ({ dia }) => {
    const config = CONFIG_DIAS[dia] ?? { label: dia };
    mostrarToast(`⚠️ Sin reemplazos disponibles para el ${config.label}.`, 'warn');
  });
};

export const render = Object.freeze({ initRender, mostrarToast });
