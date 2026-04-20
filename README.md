# 🧹 Aseo Grupo — Sistema de Gestión de Turnos Semanales

> Aplicación web para organizar y gestionar los turnos de aseo de un grupo de **22 integrantes**, con distribución aleatoria semanal, control de ausencias y reemplazos automáticos.

[![Sin dependencias](https://img.shields.io/badge/dependencias-cero-brightgreen)](.)
[![Vanilla JS](https://img.shields.io/badge/stack-Vanilla%20JS-yellow)](.)
[![ES Modules](https://img.shields.io/badge/módulos-ES6-blue)](.)
[![Sin servidor](https://img.shields.io/badge/servidor-no%20requerido-lightgrey)](.)

---

## 📋 ¿Qué hace esta aplicación?

Cada semana, los **22 integrantes** del grupo deben rotar en los turnos de aseo de lunes a viernes. Esta aplicación automatiza ese proceso:

- Distribuye los 22 miembros **aleatoriamente** en 5 días (2 grupos de 5 personas + 3 grupos de 4 personas).
- Permite **marcar ausentes** individualmente por día con un solo clic.
- Cuando alguien falta, el sistema **busca automáticamente** un reemplazante válido del pool disponible.
- Todos los datos se **guardan automáticamente** en el navegador — sin necesidad de internet ni servidor.
- Al iniciar una nueva semana, genera una **distribución completamente nueva** y borra las ausencias anteriores.

---

## ✨ Funcionalidades principales

| Funcionalidad | Descripción |
|---|---|
| 🔀 **Distribución aleatoria** | Algoritmo Fisher-Yates garantiza mezcla justa en cada semana |
| ✗ **Marcar ausente** | Un clic marca al miembro como ausente en su día asignado |
| ⇄ **Reemplazo automático** | Se selecciona automáticamente un reemplazante del pool válido |
| ↩ **Reincorporar** | Revierte la ausencia y libera al reemplazante del día |
| 📅 **Semana ISO** | Detecta automáticamente si cambió la semana y regenera si aplica |
| 💾 **Persistencia local** | Los datos sobreviven al cierre y recarga del navegador |
| ↺ **Reset completo** | Limpia todo y genera una distribución completamente nueva |
| 🔀 **Nueva semana manual** | Genera nueva distribución sin esperar al cambio de semana |
| ⚠️ **Toast de aviso** | Notifica visualmente cuando no hay reemplazantes disponibles |

---

## 🚀 Ventajas de usar este sistema

### 1. Cero instalación, cero servidor
Abre el archivo `index.html` con cualquier servidor local (Live Server, Python, etc.) y funciona de inmediato. No requiere Node.js, bases de datos, ni conexión a internet después de la primera carga.

### 2. Justo y transparente
El algoritmo Fisher-Yates garantiza que cada semana los turnos se redistribuyen de forma verdaderamente aleatoria, sin favoritismos ni patrones predecibles.

### 3. Gestión de ausencias sin fricción
Marcar a alguien como ausente y asignar un reemplazante es un proceso de **un solo clic**. No hay formularios, no hay confirmaciones innecesarias — solo se hace clic en "✗ Ausente" y el sistema resuelve el reemplazo solo.

### 4. Datos seguros en el navegador
El estado completo de la semana (grupos, ausentes y reemplazos) se guarda en `localStorage`. Si cierras el navegador o recargas la página, todo sigue exactamente donde lo dejaste.

### 5. Diseño responsivo y accesible
La interfaz funciona perfectamente en móvil, tablet y escritorio. Todos los elementos interactivos tienen atributos `aria-*` para lectores de pantalla.

### 6. Algoritmo de reemplazos inteligente
El sistema nunca asigna como reemplazante a alguien que:
- Ya pertenece al grupo asignado de ese día.
- Ya está siendo reemplazante de otro ausente del mismo día.

Esto evita duplicados y conflictos automáticamente.

---

## 🏗️ Arquitectura técnica

```
aseo-grupo/
├── index.html                  # SPA — estructura semántica HTML5
├── css/
│   └── styles.css              # CSS Mobile First con variables por día
└── js/
    ├── app.js                  # Entry point — bootstrap y controles
    ├── core/
    │   └── store.js            # Capa de persistencia (localStorage)
    ├── patterns/
    │   ├── observer.js         # Patrón Observer (Pub/Sub)
    │   └── module.js           # Patrón Module — lógica y API pública
    └── ui/
        └── render.js           # Capa de UI — manipulación del DOM
```

### Patrones de diseño utilizados

**Module Pattern** — toda la lógica de negocio está encapsulada en `aseoModule`, expuesta como un objeto congelado (`Object.freeze`) con una API pública mínima.

**Observer Pattern (Pub/Sub)** — el módulo publica eventos (`estado:actualizado`, `reemplazo:sinCandidatos`) y la capa de UI se suscribe a ellos. Ninguna capa conoce los detalles internos de la otra.

### Esquema de datos en localStorage

```json
{
  "semana": "2026-W17",
  "grupos": {
    "lunes":     ["Nombre1", "Nombre2", "Nombre3", "Nombre4", "Nombre5"],
    "martes":    ["Nombre6", "Nombre7", "Nombre8", "Nombre9", "Nombre10"],
    "miercoles": ["Nombre11", "Nombre12", "Nombre13", "Nombre14"],
    "jueves":    ["Nombre15", "Nombre16", "Nombre17", "Nombre18"],
    "viernes":   ["Nombre19", "Nombre20", "Nombre21", "Nombre22"]
  },
  "ausentes": ["Nombre Ausente"],
  "reemplazos": {
    "lunes": {
      "Nombre Ausente": "Nombre Reemplazante"
    }
  }
}
```

---

## 📖 Guía de uso

### Primer inicio
1. Clona o descarga el repositorio.
2. Abre la carpeta con **Live Server** (VS Code) o cualquier servidor HTTP local.
3. La app detecta automáticamente que no hay datos y genera la primera distribución.

### Uso diario
- **Marcar ausente:** haz clic en el botón `✗ Ausente` junto al nombre del miembro.
- **Reincorporar:** haz clic en `↩ Reincorporar` para deshacer la ausencia.
- **Nueva semana manual:** botón `🔀 Nueva semana` en el encabezado (pide confirmación).
- **Reset total:** botón `↺ Reset` en el encabezado — borra todo y regenera desde cero.

### Cambio de semana automático
Al abrir la app en una semana diferente a la guardada, se genera automáticamente una nueva distribución sin intervención del usuario.

---

## 👥 Integrantes del grupo

<details>
<summary>Ver los 22 integrantes</summary>

1. Alisson Paola Jaramillo Echeverry
2. Carlos Andrés Zuluaga Atehortua
3. Daniela Zapata López
4. David Antonio Pescador Durán
5. David Buendia Ruiz
6. Eric Daniel Barreto Chavez
7. Jhoan Steven Murillo García
8. Jhon Alejandro Patiño Agudelo
9. Juan Camilo Valencia Rey
10. Juan Carlos Combita Sandoval
11. Juan David Ferrer Castillo
12. Juan José Santamaria Muñoz
13. Julián David Flórez Vera
14. Maria Fernanda Huertas Montes
15. Nelson Fabián Gallego Sánchez
16. Santiago Moreno Piedrahita
17. Santiago Palacio Tovar
18. Santiago Tovar Zambrano
19. Sebastian Ortega Barrero
20. Stiven Andrés Robles Galán
21. Valeria Arcila Hernández
22. Valeria Becerra Giraldo

</details>

---

## 🛠️ Stack tecnológico

| Tecnología | Uso |
|---|---|
| HTML5 semántico | Estructura con `header`, `main`, `footer`, `article`, `section` |
| CSS Vanilla | Variables CSS, Mobile First, sin frameworks |
| JavaScript ES Modules | `import/export` nativo, sin bundler |
| localStorage API | Persistencia de estado sin backend |
| Paradigma funcional | Cero keyword `function`, solo arrow functions, inmutabilidad con spread |

---

## 📜 Historial de desarrollo

| Fase | Commit | Descripción |
|---|---|---|
| 1 | `build(scaffold)` | Estructura de directorios y archivos base |
| 2 | `style(ui)` | HTML5 semántico, CSS Mobile First y estados visuales |
| 3 | `feat(core)` | Persistencia localStorage y lógica de asignación semanal |
| 4 | `feat(patterns)` | Observer Pattern y Module Pattern con API pública |
| 5 | `feat(contingency)` | Reemplazo automático con algoritmo de contingencia |
| 6 | `refactor(clean)` | Corrección de bugs y auditoría clean code |

---

*Desarrollado con JavaScript puro — sin frameworks, sin dependencias, sin complicaciones.*
