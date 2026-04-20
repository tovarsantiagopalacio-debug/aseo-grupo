/**
 * app.js
 * Entry point — inicializa el sistema en el orden correcto: render → módulo → datos.
 */

import { render } from './ui/render.js';
import { aseoModule } from './patterns/module.js';

/**
 * Adjunta el evento al botón de nueva semana.
 */
const initControles = () => {
  const btnNuevaSemana = document.getElementById('btn-nueva-semana');
  if (btnNuevaSemana) {
    btnNuevaSemana.addEventListener('click', () => {
      const confirmado = window.confirm(
        '¿Generar una nueva distribución aleatoria?\nEsto borrará ausencias y reemplazos actuales.'
      );
      if (confirmado) aseoModule.nuevaSemana();
    });
  }

  const btnReset = document.getElementById('btn-reset');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      const confirmado = window.confirm(
        '¿Reiniciar completamente el estado?\nSe borrará todo y se generará una nueva distribución.'
      );
      if (confirmado) aseoModule.resetear();
    });
  }
};

/**
 * Bootstrap: inicializa subscripciones UI primero, luego carga/genera datos.
 */
const bootstrap = () => {
  render.initRender();
  initControles();
  aseoModule.inicializar();
};

document.addEventListener('DOMContentLoaded', bootstrap);
