# Guía de usuario — RaceStrategist

RaceStrategist es una plataforma para equipos de carreras de resistencia en iRacing. Te permite planificar stints, gestionar tu plantilla de pilotos y recibir telemetría en vivo durante la carrera.

---

## 1. Acceso y registro

Abre la aplicación en tu navegador. En la pantalla de inicio de sesión:

1. Introduce tu **usuario** y **contraseña**.
2. Pulsa **LOGIN** para entrar.
3. Si no tienes cuenta, puedes registrarte con el botón **SIGN UP** (actualmente deshabilitado — contacta con el administrador).

---

## 2. Panel principal (Dashboard)

Tras iniciar sesión verás el dashboard con:

- **Bienvenida** con tu nombre, clase de licencia e iRating.
- **Estrategias activas**: número de planes guardados. Pulsa **VIEW ALL** para ir a la biblioteca.
- **Gestión del equipo**: acceso directo a tu plantilla de pilotos.
- **Estrategias recientes**: las 5 últimas estrategias modificadas, con nombre, vehículo, número de stints y pilotos.

---

## 3. Calculadora de estrategia

Accede desde la barra de navegación en **STRATEGY**. Es la herramienta principal para crear un plan de carrera.

### 3.1. Parámetros iniciales

En el panel superior:

| Campo | Descripción |
|---|---|
| **Vehicle** | Nombre del vehículo (texto libre, ej: "Porsche 911 GT3 R") |
| **Tank Capacity (L)** | Capacidad del depósito en litros |
| **Event Duration (min)** | Duración total de la carrera en minutos |
| **Fuel consumption per lap (L)** | Litros de combustible consumidos por vuelta |
| **Avg. Lap Time (ms)** | Tiempo medio de vuelta en milisegundos |
| **PIT (NO TIRES)** | Duración estimada de una parada en boxes sin cambiar neumáticos (ms) |
| **PIT (WITH TIRES)** | Duración estimada de una parada con cambio de neumáticos (ms) |

### 3.2. Predicciones

Al rellenar los campos, la calculadora muestra automáticamente:

- **Max Laps per Stint**: vueltas máximas que se pueden dar con un depósito lleno.
- **Stint Duration**: duración estimada de cada stint.
- **Total Race Time**: tiempo total de carrera.
- **Estimated Stints**: número estimado de stints necesarios.

### 3.3. Guardar

Pulsa **SAVE** para almacenar la estrategia. Ponle un nombre y se guardará en tu biblioteca.

---

## 4. Planificador de stints (Equipo)

Debajo de la calculadora está el planificador, donde asignas pilotos reales a cada stint.

### 4.1. Cargar equipo

Pulsa **LOAD TEAM** y selecciona tu equipo. Esto carga la plantilla de pilotos disponible.

### 4.2. Generar plan

Tras rellenar los datos de la calculadora, pulsa **Generate Strategy Plan**. Se crea una tabla con los stints necesarios.

### 4.3. Asignar pilotos

En cada stint puedes:
- Seleccionar un **piloto** del desplegable.
- Activar/desactivar **cambio de neumáticos** (toggle de rueda).
- Añadir **tiempo extra** por incidentes o imprevistos.

### 4.4. Añadir/quitar stints

Usa los botones **+** y **🗑** en cada fila para insertar o eliminar stints.

### 4.5. Línea de tiempo

La tabla muestra para cada stint: número, piloto, vueltas, cambio de neumáticos, hora de inicio, hora de fin y duración.

### 4.6. Cobertura de stints

Un icono junto a la pestaña **PLAN** indica:
- ⚠️ **Amarillo**: sobran stints respecto a los necesarios.
- ❌ **Rojo**: faltan stints para completar la carrera.

---

## 5. Biblioteca de estrategias

Accede desde **STRATEGY** en la barra superior (o desde **VIEW ALL** en el dashboard).

- **Buscar**: filtra por nombre de estrategia o vehículo.
- **Cargar**: pulsa **LOAD_MODULE** en una tarjeta para abrirla en la calculadora.
- **Invitar**: comparte un enlace para que otros miembros del equipo colaboren en la estrategia.
- **Eliminar**: borra estrategias que ya no necesites.
- **Nueva**: pulsa **+ NEW STRATEGY** para crear una desde cero.

---

## 6. Gestión de equipos y pilotos

Accede desde **TEAM** en la navegación.

### 6.1. Crear equipo

Si no tienes equipo, pulsa **CREATE TEAM**, asígnale un nombre y créalo.

### 6.2. Añadir pilotos

Dentro de un equipo:
1. Pulsa **ADD DRIVER**.
2. Rellena: nombre, nacionalidad (emoji), licencia, iRating, rol, tiempo de vuelta, consumo y factor de error.
3. Elige un **color de acento** para identificar al piloto en la tabla de stints.
4. Pulsa **ADD TO ROSTER**.

### 6.3. Editar o eliminar pilotos

- **EDIT**: modifica los datos de un piloto existente.
- **REMOVE**: elimina un piloto de la plantilla.

---

## 7. Telemetría en vivo

Accede desde el panel de **TELEMETRY** en la calculadora de estrategia.

### 7.1. Conectar

Pulsa **CONNECT** para recibir datos en tiempo real del PC que está corriendo iRacing. Verás:

- **Velocidad, RPM, marcha** actuales.
- **Nivel de combustible**.
- **Vuelta actual** y tiempo.
- **Temperatura** de pista y aire.
- **Temporizador de carrera** (sesión transcurrida / restante).
- **Estado en boxes** (EN BOXES / EN PISTA).
- **Última vuelta completada**.

### 7.2. Ajustes en vivo

El panel **LIVE ADJUSTMENTS** compara los datos del plan con la realidad:

| Botón | Acción |
|---|---|
| **APPLY FUEL** | Actualiza el consumo de combustible con el valor real medido |
| **APPLY PACE** | Actualiza el ritmo de vuelta con el valor real medido |
| **→ FUEL ONLY** | Aplica el tiempo real de parada como parada sin neumáticos |
| **→ WITH TIRES** | Aplica el tiempo real de parada como parada con neumáticos |
| **AUTO** | Activa/desactiva la sincronización automática cada 30s |

Los datos reales se muestran en la columna **REAL** junto a los valores del **PLAN**.

### 7.3. Agentes de telemetría

En **TELEMETRY AGENTS** puedes generar tokens para que los PCs del equipo envíen telemetría al servidor:

1. Selecciona un piloto del desplegable.
2. Pulsa **GENERATE**.
3. Copia el token con el botón **TOKEN** y el comando con **CMD**.
4. Ejecuta el comando en el PC que corre iRacing.

---

## 8. Cambio de idioma

Usa los botones **EN** / **ES** en la esquina superior derecha para alternar entre inglés y español. Toda la interfaz se traduce instantáneamente.

---

## Resumen rápido

| ¿Quieres...? | Ve a... |
|---|---|
| Crear una estrategia nueva | **STRATEGY** > rellena datos > **SAVE** |
| Planificar stints con pilotos | **STRATEGY** > **Generate Strategy Plan** > asigna pilotos |
| Ver/editar estrategias guardadas | **STRATEGY LIBRARY** |
| Gestionar tu equipo | **TEAM** |
| Ver telemetría en vivo | **STRATEGY** > panel **TELEMETRY** > **CONNECT** |
| Cambiar idioma | Botones **EN/ES** arriba a la derecha |
