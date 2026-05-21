# Documentación de componentes y flujos del frontend

Este documento releva los principales componentes de interfaz del frontend y describe cómo se conectan entre sí en los flujos de navegación principales del sistema.

## Objetivo

La aplicación frontend está organizada como una SPA en React con enrutamiento por roles. Su propósito es permitir que cada tipo de usuario ingrese al sistema, vea un dashboard acorde a su rol y navegue por módulos de gestión, evaluación y estadísticas sin perder contexto.

La arquitectura actual separa bien las responsabilidades entre:

- [src/App.tsx](../src/App.tsx): routing, protección de rutas y control de sesión.
- [src/pages](../src/pages): pantallas principales del sistema.
- [src/components](../src/components): piezas reutilizables y vistas compuestas.
- [src/api](../src/api): acceso a datos y comunicación con el backend.

## Mapa general de la aplicación

El frontend se organiza alrededor de tres capas funcionales:

1. Entrada y sesión.
2. Navegación por rol.
3. Vistas de gestión y consulta.

El flujo general es:

Login -> persistencia de tokens y perfil -> Home -> acceso a módulos según rol -> formularios, listados, estadísticas y gestión detallada.

## Componentes principales de interfaz

### 1. Capa de navegación y sesión

#### [src/App.tsx](../src/App.tsx)

Es el componente central de ruteo. Su responsabilidad es:

- leer el usuario actual desde `localStorage`;
- proteger rutas privadas;
- redirigir según autenticación y rol;
- coordinar el login y el logout.

Desde acá se define qué pantallas son públicas y cuáles requieren sesión activa. También se concentra la autorización por rol para accesos especiales como usuarios administrativos y estadísticas específicas.

#### [src/pages/Login.tsx](../src/pages/Login.tsx)

Pantalla de autenticación. El usuario ingresa credenciales, se invoca la API de login y, si la respuesta es válida, se guardan los datos de sesión en `localStorage`.

Uso esperado:

- acceso inicial al sistema;
- recuperación de sesión después de cerrar el navegador;
- punto de entrada para usuarios nuevos o recurrentes.

#### [src/pages/Home.tsx](../src/pages/Home.tsx)

Es la pantalla de inicio post-login. Lee el perfil del usuario y muestra un dashboard distinto según el rol.

Uso esperado:

- ser la landing principal de usuarios autenticados;
- mostrar identidad del usuario y acceso al perfil;
- centralizar el logout;
- derivar a un dashboard acorde al rol.

#### [src/pages/Perfil.tsx](../src/pages/Perfil.tsx)

Modal o formulario de perfil asociado a la pantalla principal. Permite revisar y actualizar datos del usuario sin abandonar el flujo actual.

## 2. Dashboards por rol

#### [src/pages/dashboards/DocenteDashboard.tsx](../src/pages/dashboards/DocenteDashboard.tsx)

Vista orientada al docente. Resume la actividad y las acciones de uso frecuente.

#### [src/pages/dashboards/DirectivoDashboard.tsx](../src/pages/dashboards/DirectivoDashboard.tsx)

Vista orientada a directivos. Prioriza gestión institucional y acceso a información operativa.

#### [src/pages/dashboards/AdminDashboard.tsx](../src/pages/dashboards/AdminDashboard.tsx)

Vista usada por `encargado_zona` y `equipo_padi`. Agrupa acciones administrativas, navegación operativa y accesos a gestión avanzada.

## 3. Módulos de gestión

#### [src/pages/PanelControl.tsx](../src/pages/PanelControl.tsx)

Es la vista más estructurada desde el punto de vista de navegación. Implementa un recorrido en cascada para administrar la jerarquía institucional:

zona -> escuela -> sala -> aula -> estudiantes

Uso esperado:

- para `equipo_padi`, navegar y administrar zonas y encargados;
- para `encargado_zona`, explorar escuelas vinculadas y sus estructuras;
- restaurar contexto desde query params cuando el usuario vuelve a una vista previa;
- servir como centro de consulta para información jerárquica.

#### [src/pages/Zonas.tsx](../src/pages/Zonas.tsx)

Pantalla de administración de zonas. Se apoya en componentes de formulario y asignación para modificar relaciones entre zonas, escuelas y encargados.

#### [src/pages/Escuelas.tsx](../src/pages/Escuelas.tsx)

Pantalla de gestión de escuelas. Normalmente se acompaña con listados, formularios y paneles de detalle.

#### [src/pages/Aulas.tsx](../src/pages/Aulas.tsx)

Vista de administración de aulas. Permite consultar y operar sobre la estructura de aulas y sus vínculos con estudiantes o docentes.

#### [src/pages/Estudiantes.tsx](../src/pages/Estudiantes.tsx)

Vista de gestión de estudiantes. Suele combinar filtros, formularios y listados compactos para alta, edición y asignación.

#### [src/pages/Docentes.tsx](../src/pages/Docentes.tsx)

Pantalla de administración de docentes y sus relaciones con escuelas o aulas.

#### [src/pages/Directivos.tsx](../src/pages/Directivos.tsx)

Pantalla orientada a la gestión de directivos y sus asignaciones.

#### [src/pages/GestionUsuariosPage.tsx](../src/pages/GestionUsuariosPage.tsx)

Sección administrativa exclusiva para `equipo_padi`. Centraliza la gestión de usuarios del sistema.

## 4. Flujo de evaluaciones y seguimiento

#### [src/pages/Evaluaciones.tsx](../src/pages/Evaluaciones.tsx)

Listado o punto de entrada al módulo de evaluaciones.

#### [src/pages/EvaluacionesDocente.tsx](../src/pages/EvaluacionesDocente.tsx)

Vista focalizada en el trabajo del docente sobre evaluaciones asignadas o disponibles.

#### [src/pages/HistorialEstudiante.tsx](../src/pages/HistorialEstudiante.tsx)

Pantalla de seguimiento histórico del estudiante, útil para revisar evolución y antecedentes.

#### [src/pages/EstadisticasPadi.tsx](../src/pages/EstadisticasPadi.tsx)

Tablero de estadísticas globales para el equipo PADI.

#### [src/pages/EstadisticasZona.tsx](../src/pages/EstadisticasZona.tsx)

Vista de métricas por zona, orientada al encargado de zona.

#### [src/pages/EstadisticasEscuela.tsx](../src/pages/EstadisticasEscuela.tsx)

Vista de estadísticas institucionales para directivos, encargados y equipo PADI.

#### [src/pages/EstadisticasDocente.tsx](../src/pages/EstadisticasDocente.tsx)

Vista de métricas personales o de desempeño asociadas al docente.

## Componentes reutilizables más relevantes

### Listados y vistas de entidades

- [src/components/EscuelasList.tsx](../src/components/EscuelasList.tsx)
- [src/components/AulasList.tsx](../src/components/AulasList.tsx)
- [src/components/EstudiantesList.tsx](../src/components/EstudiantesList.tsx)
- [src/components/EvaluacionesList.tsx](../src/components/EvaluacionesList.tsx)
- [src/components/EvaluacionesTable.tsx](../src/components/EvaluacionesTable.tsx)
- [src/components/EstudiantesCompacto.tsx](../src/components/EstudiantesCompacto.tsx)

Estos componentes muestran datos organizados por entidad o por jerarquía. El caso más complejo es `EstudiantesCompacto`, porque agrupa por escuela, sala y comisión y además incorpora acciones de navegación y edición.

### Formularios y modales

- [src/components/EscuelaForm.tsx](../src/components/EscuelaForm.tsx)
- [src/components/EstudianteForm.tsx](../src/components/EstudianteForm.tsx)
- [src/components/DocenteForm.tsx](../src/components/DocenteForm.tsx)
- [src/components/EncargadoZonaForm.tsx](../src/components/EncargadoZonaForm.tsx)
- [src/components/ZonaForm.tsx](../src/components/ZonaForm.tsx)
- [src/components/AsignarEscuelaModal.tsx](../src/components/AsignarEscuelaModal.tsx)
- [src/components/AsignarEncargadoModal.tsx](../src/components/AsignarEncargadoModal.tsx)
- [src/components/EditarEscuela.tsx](../src/components/EditarEscuela.tsx)
- [src/components/BulkUploadForm.tsx](../src/components/BulkUploadForm.tsx)

Su función es encapsular alta, edición, carga masiva y asignaciones sin mezclar la lógica de negocio dentro de las páginas principales.

### Paneles y detalles

- [src/components/EscuelaDetalle.tsx](../src/components/EscuelaDetalle.tsx)
- [src/components/EstudiantesAulaView.tsx](../src/components/EstudiantesAulaView.tsx)
- [src/components/AulasView.tsx](../src/components/AulasView.tsx)
- [src/components/EscuelasView.tsx](../src/components/EscuelasView.tsx)
- [src/components/SalasView.tsx](../src/components/SalasView.tsx)
- [src/components/GestionDocentesAula.tsx](../src/components/GestionDocentesAula.tsx)
- [src/components/ActividadDocentes.tsx](../src/components/ActividadDocentes.tsx)

Estas vistas funcionan como pasos intermedios en la navegación jerárquica, especialmente dentro de `PanelControl`.

### Componentes de estadísticas

- [src/components/GraficoActividadDocentes.tsx](../src/components/GraficoActividadDocentes.tsx)
- [src/components/GraficoAprobacionPreguntas.tsx](../src/components/GraficoAprobacionPreguntas.tsx)
- [src/components/GraficoAreasCriticas.tsx](../src/components/GraficoAreasCriticas.tsx)
- [src/components/GraficoCobertura.tsx](../src/components/GraficoCobertura.tsx)
- [src/components/GraficoComparativa.tsx](../src/components/GraficoComparativa.tsx)
- [src/components/GraficoDistribucion.tsx](../src/components/GraficoDistribucion.tsx)
- [src/components/GraficoEvolucion.tsx](../src/components/GraficoEvolucion.tsx)
- [src/components/GraficoItemsError.tsx](../src/components/GraficoItemsError.tsx)
- [src/components/GraficoRendimientoZonas.tsx](../src/components/GraficoRendimientoZonas.tsx)
- [src/components/HeatmapAreas.tsx](../src/components/HeatmapAreas.tsx)
- [src/components/ProgresionEstudiante.tsx](../src/components/ProgresionEstudiante.tsx)
- [src/components/DistribucionPuntajes.tsx](../src/components/DistribucionPuntajes.tsx)
- [src/components/AreasCriticas.tsx](../src/components/AreasCriticas.tsx)
- [src/components/CoberturaZonas.tsx](../src/components/CoberturaZonas.tsx)
- [src/components/ComparativaEscuela.tsx](../src/components/ComparativaEscuela.tsx)
- [src/components/EstudiantesRiesgo.tsx](../src/components/EstudiantesRiesgo.tsx)
- [src/components/EvolucionAreas.tsx](../src/components/EvolucionAreas.tsx)

Estos componentes se usan para componer tableros de análisis. Cada uno resuelve una visualización específica y debería permanecer lo más puro posible, con datos ya preparados por las páginas o por la capa API.

### Componentes de soporte visual

- [src/components/DashboardCard.tsx](../src/components/DashboardCard.tsx)
- [src/components/BotonNuevo.tsx](../src/components/BotonNuevo.tsx)
- [src/components/PageHeader.tsx](../src/components/PageHeader.tsx)
- [src/components/SearchBar.tsx](../src/components/SearchBar.tsx)
- [src/components/EvaluacionWizard.tsx](../src/components/EvaluacionWizard.tsx)
- [src/components/EvaluacionForm.tsx](../src/components/EvaluacionForm.tsx)
- [src/components/EvaluacionDetalle.tsx](../src/components/EvaluacionDetalle.tsx)
- [src/components/EvaluacionRevision.tsx](../src/components/EvaluacionRevision.tsx)

Son componentes de apoyo para mantener consistencia visual y de interacción en la interfaz.

## Flujos de navegación principales

### Flujo 1: acceso y autenticación

1. El usuario entra a `/login`.
2. `Login` autentica contra la API.
3. Si la autenticación es correcta, se guardan token, refresh token y perfil.
4. `App.tsx` redirige a `/home`.
5. `Home` decide qué dashboard mostrar según el rol.

### Flujo 2: inicio y salida de sesión

1. El usuario ve su información básica en `Home`.
2. Puede abrir el perfil desde el botón correspondiente.
3. Puede cerrar sesión desde el botón `Salir`.
4. `App.tsx` limpia la sesión y redirige al login.

### Flujo 3: navegación administrativa

1. `equipo_padi` accede a módulos administrativos como usuarios, zonas y estadísticas globales.
2. `encargado_zona` accede a panel de control y estadísticas de su zona.
3. `director` accede a gestión institucional y estadísticas de escuela.
4. `docente` accede a su dashboard, evaluaciones y estadísticas docentes.

### Flujo 4: gestión jerárquica en cascada

1. El usuario entra en `PanelControl`.
2. Selecciona una zona o escuela.
3. Navega a salas, luego aulas y luego estudiantes.
4. Desde una vista intermedia puede volver atrás sin perder completamente el contexto.

### Flujo 5: evaluaciones y seguimiento

1. Se accede a `Evaluaciones` o `EvaluacionesDocente`.
2. Se consulta el detalle, se revisa o se carga una instancia.
3. El sistema puede llevar al historial del estudiante para analizar evolución.
4. Las estadísticas complementan la lectura operativa con métricas visuales.

## Relación entre capas

El frontend funciona bien si se piensa así:

- `App.tsx` controla acceso y navegación.
- Las páginas coordinan estado de pantalla y orquestan llamadas.
- Los componentes reutilizables resuelven UI puntual o bloques de visualización.
- `src/api` mantiene aislado el acceso a datos.

Ese esquema evita que la lógica de backend o la lógica de negocio quede dispersa dentro de componentes visuales pequeños.

## Criterio de uso esperado

La interfaz está pensada para que cada usuario vea solo lo que necesita:

- el docente entra, consulta y evalúa;
- el director administra y sigue rendimiento institucional;
- el encargado de zona navega por su jurisdicción;
- el equipo PADI ve la foto global del sistema y administra usuarios.

En otras palabras, la aplicación no pretende ser una UI genérica de administración, sino una experiencia guiada por rol y por jerarquía institucional.
