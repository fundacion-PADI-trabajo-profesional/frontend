# PADI - Login Application

Una aplicación de login moderna con diseño inspirado en la naturaleza, construida con React, TypeScript y Material-UI.

## Características

- 🔐 Sistema de autenticación con mock (sin backend)
- 🎨 Diseño moderno con tema verde natural
- 📱 Interfaz responsiva y amigable
- 🚀 Navegación con React Router
- ✨ Animaciones y transiciones suaves
- 🌿 Diseño split-screen con imagen de naturaleza

## Tecnologías Utilizadas

- **React 19** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Material-UI (MUI)** - Componentes de UI
- **React Router DOM** - Navegación
- **Emotion** - CSS-in-JS
- **TanStack Query** - Gestión de estado del servidor
- **Storybook** - Desarrollo de componentes aislados
- **Vitest** - Framework de tests unitarios

## Requisitos Previos

- Node.js (versión 18 o superior)
- npm o yarn

## Instalación

1. Clona el repositorio:
\`\`\`bash
git clone <repository-url>
cd padi
\`\`\`

2. Instala las dependencias:
\`\`\`bash
npm install
\`\`\`

## Scripts Disponibles

### Desarrollo

\`\`\`bash
npm run dev
# o
npm start
\`\`\`

Inicia el servidor de desarrollo en [http://localhost:5173](http://localhost:5173)

### Build de Producción

\`\`\`bash
npm run build
\`\`\`

Compila la aplicación para producción en la carpeta `dist`

### Preview de Producción

\`\`\`bash
npm run preview
\`\`\`

Previsualiza el build de producción localmente

### Linting

\`\`\`bash
npm run lint
\`\`\`

Ejecuta ESLint para verificar el código

### Storybook

\`\`\`bash
npm run storybook
\`\`\`

Inicia Storybook en [http://localhost:6006](http://localhost:6006)

\`\`\`bash
npm run build-storybook
\`\`\`

Genera el build estático de Storybook

---

## Tests

### Correr los tests

\`\`\`bash
# Modo watch (reejecutar al guardar cambios)
npm run test

# Ejecución única (ideal para CI)
npm run test:run

# Ejecución única con reporte de cobertura
npm run test:coverage
\`\`\`

### Estructura de los tests

Los tests viven en `test/` y se organizan en dos categorías:

\`\`\`
test/
├── setup.ts                    # Configuración global: mocks de localStorage y fetch
├── utils/
│   └── permissions.test.ts     # Tests de funciones de permisos por rol
└── api/
    ├── evaluaciones.test.ts    # Sección Evaluaciones
    ├── aulas.test.ts           # Sección Aulas
    ├── escuelas.test.ts        # Sección Escuelas
    ├── estudiantes.test.ts     # Sección Estudiantes
    ├── zonas.test.ts           # Sección Zonas
    ├── docentes.test.ts        # Sección Docentes
    └── encargados-zona.test.ts # Sección Encargados de Zona
\`\`\`

### Qué se testea

- **`utils/permissions.test.ts`** — Funciones puras de `src/utils/permissions.ts`: verifica que cada rol tenga exactamente los permisos definidos (`canEquipoPadi`, `canDirector`, `permissions.createAula`, etc.).

- **`api/*.test.ts`** — Funciones del cliente HTTP en `src/api/`. Cada test verifica:
  - Que se llame al endpoint correcto (URL y método HTTP).
  - Que se incluyan `usuario_id` y `rol` en los parámetros cuando corresponde.
  - Que se devuelva la data mapeada al formato esperado por el frontend.
  - Que se lance un error con el mensaje correcto cuando el servidor responde con fallo.

### Tecnología y configuración

- **Framework**: [Vitest](https://vitest.dev/) v3 en entorno `node`.
- **Configuración**: `vitest.config.ts` en la raíz del proyecto.
- **Variables de entorno**: `.env.test` define `VITE_API_URL=http://localhost:3000` para los tests.
- **Setup global**: `test/setup.ts` registra mocks de `localStorage` y `fetch` antes de cada suite.
- **Mocking de módulos**: Los archivos que usan el cliente axios (`api` de `./auth`) son mockeados con `vi.mock` + `vi.hoisted` para evitar problemas de hoisting.

### Coverage

\`\`\`bash
npm run test:coverage
\`\`\`

Genera un reporte en tres formatos:

| Formato | Ubicación | Uso |
|---------|-----------|-----|
| `text` | Terminal | Resumen rápido al final de cada run |
| `html` | `coverage/index.html` | Reporte interactivo navegable por archivo y línea |
| `lcov` | `coverage/lcov.info` | Integración con herramientas externas (SonarQube, Codecov) |

Para ver el reporte HTML, abrir `coverage/index.html` en el navegador después de correr el comando.

El proyecto exige un mínimo de **70%** en líneas, funciones, branches y statements. Si el coverage cae por debajo, el comando termina con error (útil para CI).

Los archivos medidos son `src/api/**` y `src/utils/**`. `src/api/auth.ts` está excluido porque es infraestructura (cliente axios + headers).

---

### Agregar un nuevo test

1. Crear el archivo en `test/api/<nombre>.test.ts`.
2. Mockear el módulo `auth` si el archivo usa el cliente `api` (axios):

   \`\`\`typescript
   const apiMock = vi.hoisted(() => ({
     get: vi.fn(),
     post: vi.fn(),
   }));

  vi.mock("../../src/api/auth", () => ({
     api: apiMock,
     getAuthHeaders: () => ({ Authorization: "Bearer fake" }),
   }));
   \`\`\`

3. Para simular un usuario logueado, usar el helper `setUserInStorage`:

   \`\`\`typescript
  import { setUserInStorage, mockFetchResponse } from "../setup";

   beforeEach(() => {
     setUserInStorage({ id: "u-1", rol: "equipo_padi" });
   });
   \`\`\`

4. Para mockear `fetch`, usar `mockFetchResponse`:

   \`\`\`typescript
   vi.mocked(fetch).mockResolvedValue(
     mockFetchResponse({ success: true, data: [{ id: "x-1" }] })
   );
   \`\`\`

## Credenciales de Prueba

Para acceder a la aplicación, utiliza las siguientes credenciales mock:

- **Usuario**: Cualquier nombre de usuario
- **Contraseña**: `password123`

## Estructura del Proyecto

\`\`\`
padi/
├── public/              # Archivos estáticos
│   └── child-painting-creative-art-colorful.jpg
├── src/
│   ├── pages/          # Páginas de la aplicación
│   │   ├── Login.tsx   # Página de login
│   │   └── Home.tsx    # Página de inicio
│   ├── App.tsx         # Componente principal con routing
│   ├── App.css         # Estilos globales
│   ├── main.tsx        # Punto de entrada
│   └── vite-env.d.ts   # Tipos de Vite
├── app/                # Estructura Next.js para preview
│   └── page.tsx        # Página de preview
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
\`\`\`

## Características del Login

- Diseño split-screen con imagen de naturaleza
- Logo circular con hojas en el lado izquierdo
- Formulario de login en panel verde menta
- Campos de entrada con iconos (usuario y candado)
- Botón de "Forgot Password"
- Botón de login con color verde lima
- Botón de retroceso en la esquina superior izquierda
- Fondo con degradado verde

## Características de la Página de Inicio

- Hero section con imagen de fondo
- Sección de características con grid de 3 columnas
- Diseño limpio y minimalista
- Botón de logout
- Tipografía serif elegante para títulos
- Colores inspirados en la naturaleza

## Desarrollo

El proyecto utiliza Vite para un desarrollo rápido con Hot Module Replacement (HMR). Los cambios se reflejan instantáneamente en el navegador.

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto es privado y no tiene licencia pública.

## Soporte

Para problemas o preguntas, por favor abre un issue en el repositorio.
