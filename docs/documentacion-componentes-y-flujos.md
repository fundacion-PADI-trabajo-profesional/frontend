# Documentación de componentes y flujos del frontend

Este documento releva los principales componentes de interfaz del frontend y describe cómo se conectan entre sí en los flujos de navegación principales del sistema.

## Objetivo

La aplicación frontend está organizada como una SPA en React con enrutamiento por roles. Su propósito es permitir que cada tipo de usuario ingrese al sistema, vea un dashboard acorde a su rol y navegue por módulos de gestión, evaluación y estadísticas sin perder contexto.

La arquitectura actual separa bien las responsabilidades entre:

- [src/App.tsx](../src/App.tsx): routing, protección de rutas y control de sesión.
- [src/pages](../src/pages): pantallas principales del sistema, organizadas por dominio.
- [src/components](../src/components): piezas reutilizables y vistas compuestas, organizadas por dominio.
- [src/api](../src/api): acceso a datos y comunicación con el backend.
- [src/utils](../src/utils): utilidades transversales de lógica de presentación.

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

### Flujo de recuperación y cambio de contraseña

Las pantallas de gestión de contraseña viven bajo [src/pages/auth/](../src/pages/auth/):

- [src/pages/auth/SolicitarRecuperoPassword.tsx](../src/pages/auth/SolicitarRecuperoPassword.tsx): formulario para iniciar el recupero, ingresando el email registrado.
- [src/pages/auth/ActualizarContrasena.tsx](../src/pages/auth/ActualizarContrasena.tsx): pantalla de cambio de contraseña mediante el token de recupero recibido por mail.
- [src/pages/auth/CambiarContrasenaTemporal.tsx](../src/pages/auth/CambiarContrasenaTemporal.tsx): flujo forzado para usuarios con contraseña temporal que deben actualizarla en el primer login.

## 2. Dashboards por rol

Los dashboards viven bajo [src/pages/dashboards/](../src/pages/dashboards/):

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

Sección administrativa exclusiva para `equipo_padi`. Centraliza la gestión de usuarios del sistema. Orquesta los componentes de la carpeta `usuarios/`.

## 4. Flujo de evaluaciones y seguimiento

#### [src/pages/Evaluaciones.tsx](../src/pages/Evaluaciones.tsx)

Listado o punto de entrada al módulo de evaluaciones.

#### [src/pages/EvaluacionesDocente.tsx](../src/pages/EvaluacionesDocente.tsx)

Vista focalizada en el trabajo del docente sobre evaluaciones asignadas o disponibles.

#### [src/pages/HistorialEstudiante.tsx](../src/pages/HistorialEstudiante.tsx)

Pantalla de seguimiento histórico del estudiante, útil para revisar evolución y antecedentes.

## 5. Estadísticas

Las páginas de estadísticas viven bajo [src/pages/estadisticas/](../src/pages/estadisticas/):

#### [src/pages/estadisticas/EstadisticasPadi.tsx](../src/pages/estadisticas/EstadisticasPadi.tsx)

Tablero de estadísticas globales para el equipo PADI.

#### [src/pages/estadisticas/EstadisticasZona.tsx](../src/pages/estadisticas/EstadisticasZona.tsx)

Vista de métricas por zona, orientada al encargado de zona.

#### [src/pages/estadisticas/EstadisticasEscuela.tsx](../src/pages/estadisticas/EstadisticasEscuela.tsx)

Vista de estadísticas institucionales para directivos, encargados y equipo PADI.

#### [src/pages/estadisticas/EstadisticasDocente.tsx](../src/pages/estadisticas/EstadisticasDocente.tsx)

Vista de métricas personales o de desempeño asociadas al docente.

## Componentes reutilizables

Los componentes están organizados en subdirectorios por dominio dentro de [src/components/](../src/components/).

### Escuelas — [src/components/escuelas/](../src/components/escuelas/)

- [EscuelasList.tsx](../src/components/escuelas/EscuelasList.tsx)
- [EscuelasView.tsx](../src/components/escuelas/EscuelasView.tsx)
- [EscuelaDetalle.tsx](../src/components/escuelas/EscuelaDetalle.tsx)
- [EditarEscuela.tsx](../src/components/escuelas/EditarEscuela.tsx)
- [AsignarEscuelaModal.tsx](../src/components/escuelas/AsignarEscuelaModal.tsx)
- [AsignarEncargadoModal.tsx](../src/components/escuelas/AsignarEncargadoModal.tsx)

### Aulas — [src/components/aulas/](../src/components/aulas/)

- [AulasList.tsx](../src/components/aulas/AulasList.tsx)
- [AulasView.tsx](../src/components/aulas/AulasView.tsx)
- [SalasView.tsx](../src/components/aulas/SalasView.tsx)
- [EstudiantesAulaView.tsx](../src/components/aulas/EstudiantesAulaView.tsx)
- [GestionDocentesAula.tsx](../src/components/aulas/GestionDocentesAula.tsx)

Estas vistas funcionan como pasos intermedios en la navegación jerárquica dentro de `PanelControl`.

### Estudiantes — [src/components/estudiantes/](../src/components/estudiantes/)

- [EstudiantesList.tsx](../src/components/estudiantes/EstudiantesList.tsx)
- [EstudiantesCompacto.tsx](../src/components/estudiantes/EstudiantesCompacto.tsx): el más complejo; agrupa por escuela, sala y comisión e incorpora acciones de navegación y edición.
- [EstudiantesRiesgo.tsx](../src/components/estudiantes/EstudiantesRiesgo.tsx)

### Evaluaciones — [src/components/evaluaciones/](../src/components/evaluaciones/)

- [EvaluacionesList.tsx](../src/components/evaluaciones/EvaluacionesList.tsx)
- [EvaluacionesTable.tsx](../src/components/evaluaciones/EvaluacionesTable.tsx)
- [EvaluacionWizard.tsx](../src/components/evaluaciones/EvaluacionWizard.tsx)
- [EvaluacionForm.tsx](../src/components/forms/EvaluacionForm.tsx)
- [EvaluacionDetalle.tsx](../src/components/evaluaciones/EvaluacionDetalle.tsx)
- [EvaluacionRevision.tsx](../src/components/evaluaciones/EvaluacionRevision.tsx)

### Formularios — [src/components/forms/](../src/components/forms/)

- [EscuelaForm.tsx](../src/components/forms/EscuelaForm.tsx)
- [EstudianteForm.tsx](../src/components/forms/EstudianteForm.tsx)
- [DocenteForm.tsx](../src/components/forms/DocenteForm.tsx)
- [EncargadoZonaForm.tsx](../src/components/forms/EncargadoZonaForm.tsx)
- [ZonaForm.tsx](../src/components/forms/ZonaForm.tsx)
- [EvaluacionForm.tsx](../src/components/forms/EvaluacionForm.tsx)
- [BulkUploadForm.tsx](../src/components/forms/BulkUploadForm.tsx)

Encapsulan alta, edición, carga masiva y asignaciones sin mezclar lógica de negocio en las páginas principales.

### Usuarios — [src/components/usuarios/](../src/components/usuarios/)

Modales y acciones para la gestión de usuarios, usados exclusivamente desde `GestionUsuariosPage`:

- [ModalCrearUsuario.tsx](../src/components/usuarios/ModalCrearUsuario.tsx)
- [ModalCambiarRol.tsx](../src/components/usuarios/ModalCambiarRol.tsx)
- [ModalConfirmarEliminar.tsx](../src/components/usuarios/ModalConfirmarEliminar.tsx)
- [ModalCargaMasiva.tsx](../src/components/usuarios/ModalCargaMasiva.tsx)
- [types.ts](../src/components/usuarios/types.ts): tipos compartidos del dominio de usuarios.

También existe [src/components/GestionUsuarios.tsx](../src/components/GestionUsuarios.tsx), que implementa la vista principal de la lista de usuarios y orquesta los modales anteriores.

### Estadísticas y gráficos — [src/components/graficos/](../src/components/graficos/)

Gráficos puros, con datos ya preparados por las páginas o por la capa API:

- [GraficoActividadDocentes.tsx](../src/components/graficos/GraficoActividadDocentes.tsx)
- [GraficoAprobacionPreguntas.tsx](../src/components/graficos/GraficoAprobacionPreguntas.tsx)
- [GraficoAreasCriticas.tsx](../src/components/graficos/GraficoAreasCriticas.tsx)
- [GraficoCobertura.tsx](../src/components/graficos/GraficoCobertura.tsx)
- [GraficoComparativa.tsx](../src/components/graficos/GraficoComparativa.tsx)
- [GraficoDistribucion.tsx](../src/components/graficos/GraficoDistribucion.tsx)
- [GraficoEvolucion.tsx](../src/components/graficos/GraficoEvolucion.tsx)
- [GraficoItemsError.tsx](../src/components/graficos/GraficoItemsError.tsx)
- [GraficoNivelSocioeconomico.tsx](../src/components/graficos/GraficoNivelSocioeconomico.tsx)
- [GraficoRendimientoZonas.tsx](../src/components/graficos/GraficoRendimientoZonas.tsx)
- [HeatmapAreas.tsx](../src/components/graficos/HeatmapAreas.tsx)
- [ProgresionEstudiante.tsx](../src/components/graficos/ProgresionEstudiante.tsx)

Contenedores de análisis (composición de gráficos y lógica de visualización):

- [ActividadDocentes.tsx](../src/components/graficos/ActividadDocentes.tsx)
- [AreasCriticas.tsx](../src/components/graficos/AreasCriticas.tsx)
- [CoberturaZonas.tsx](../src/components/graficos/CoberturaZonas.tsx)
- [ComparativaEscuela.tsx](../src/components/graficos/ComparativaEscuela.tsx)
- [DistribucionPuntajes.tsx](../src/components/graficos/DistribucionPuntajes.tsx)
- [EvolucionAreas.tsx](../src/components/graficos/EvolucionAreas.tsx)

### Componentes comunes — [src/components/common/](../src/components/common/)

Piezas de soporte visual para mantener consistencia en la interfaz:

- [DashboardCard.tsx](../src/components/common/DashboardCard.tsx)
- [BotonNuevo.tsx](../src/components/common/BotonNuevo.tsx)
- [PageHeader.tsx](../src/components/common/PageHeader.tsx)
- [SearchBar.tsx](../src/components/common/SearchBar.tsx)
- [SinEscuelaAsignada.tsx](../src/components/common/SinEscuelaAsignada.tsx): estado vacío para usuarios sin escuela asignada.

## Utilidades — [src/utils/](../src/utils/)

- [src/utils/permissions.ts](../src/utils/permissions.ts): helpers para verificar permisos y roles del usuario activo, centralizando la lógica de autorización en componentes.
- [src/utils/docentes-aulas.ts](../src/utils/docentes-aulas.ts): utilidades de presentación y transformación de datos para el dominio docentes-aulas.

## Flujos de navegación principales

### Flujo 1: acceso y autenticación

1. El usuario entra a `/login`.
2. `Login` autentica contra la API.
3. Si la autenticación es correcta, se guardan token, refresh token y perfil.
4. `App.tsx` redirige a `/home`.
5. `Home` decide qué dashboard mostrar según el rol.

Si el usuario tiene contraseña temporal, se lo redirige a `CambiarContrasenaTemporal` antes de llegar al home.

### Flujo 2: recupero de contraseña

1. El usuario accede a `SolicitarRecuperoPassword` y envía su email.
2. Recibe un link por correo que lo lleva a `ActualizarContrasena` con el token de recupero.
3. Una vez cambiada la contraseña, se redirige al login.

### Flujo 3: inicio y salida de sesión

1. El usuario ve su información básica en `Home`.
2. Puede abrir el perfil desde el botón correspondiente.
3. Puede cerrar sesión desde el botón `Salir`.
4. `App.tsx` limpia la sesión y redirige al login.

### Flujo 4: navegación administrativa

1. `equipo_padi` accede a módulos administrativos como usuarios, zonas y estadísticas globales.
2. `encargado_zona` accede a panel de control y estadísticas de su zona.
3. `director` accede a gestión institucional y estadísticas de escuela.
4. `docente` accede a su dashboard, evaluaciones y estadísticas docentes.

### Flujo 5: gestión jerárquica en cascada

1. El usuario entra en `PanelControl`.
2. Selecciona una zona o escuela.
3. Navega a salas, luego aulas y luego estudiantes.
4. Desde una vista intermedia puede volver atrás sin perder completamente el contexto.

### Flujo 6: evaluaciones y seguimiento

1. Se accede a `Evaluaciones` o `EvaluacionesDocente`.
2. Se consulta el detalle, se revisa o se carga una instancia.
3. El sistema puede llevar al historial del estudiante para analizar evolución.
4. Las estadísticas complementan la lectura operativa con métricas visuales.

## Relación entre capas

El frontend funciona bien si se piensa así:

- `App.tsx` controla acceso y navegación.
- Las páginas coordinan estado de pantalla y orquestan llamadas.
- Los componentes reutilizables resuelven UI puntual o bloques de visualización.
- `src/utils` concentra lógica transversal de presentación (permisos, transformaciones de datos).
- `src/api` mantiene aislado el acceso a datos.

Ese esquema evita que la lógica de backend o la lógica de negocio quede dispersa dentro de componentes visuales pequeños.

## Criterio de uso esperado

La interfaz está pensada para que cada usuario vea solo lo que necesita:

- el docente entra, consulta y evalúa;
- el director administra y sigue rendimiento institucional;
- el encargado de zona navega por su jurisdicción;
- el equipo PADI ve la foto global del sistema y administra usuarios.

En otras palabras, la aplicación no pretende ser una UI genérica de administración, sino una experiencia guiada por rol y por jerarquía institucional.
