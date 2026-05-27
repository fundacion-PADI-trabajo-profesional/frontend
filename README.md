# PADI - Frontend

Este repositorio contiene la interfaz web del sistema PADI.

## Tecnologías utilizadas

- **React 19**: biblioteca principal de interfaz.
- **TypeScript**: tipado estático y consistencia del código.
- **Vite**: entorno de desarrollo y compilación.
- **Material-UI (MUI)**: librería de componentes visuales.
- **React Router DOM**: navegación y enrutamiento.
- **Emotion**: estilos basados en CSS-in-JS.
- **Storybook**: desarrollo aislado de componentes.
- **Vitest**: pruebas unitarias y cobertura.
- **Recharts**: visualización de datos.
- **Next.js**: capa de preview utilizada en `app/`.

## Requisitos previos

- Node.js 18 o superior.
- npm.

## Documentación funcional del frontend

Para una descripción funcional de la interfaz, los componentes principales y los flujos de navegación, consultar [docs/documentacion-componentes-y-flujos.md](docs/documentacion-componentes-y-flujos.md).

## Estructura del proyecto

```
padi/
├── app/              # Capa de preview del frontend principal
├── docs/             # Documentación funcional y complementaria
├── src/
│   ├── api/          # Cliente HTTP y funciones por dominio
│   ├── components/   # Componentes reutilizables y vistas compuestas
│   ├── pages/        # Pantallas principales del sistema
│   ├── utils/        # Utilidades compartidas
│   ├── App.tsx       # Ruteo y control de acceso
│   ├── main.tsx      # Punto de entrada de Vite
│   └── theme.ts      # Tema visual centralizado
├── test/             # Pruebas del frontend
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Instalación

1. Clonar el repositorio.

  ```bash
  git clone <repository-url>
  cd padi
  ```

2. Instalar las dependencias.

  ```bash
  npm install
  ```

## Configuración del entorno

La URL del backend se configura con la variable de entorno `VITE_API_URL`.

| Archivo | Propósito |
|---|---|
| `.env` | Apunta al backend de producción (Firebase Cloud Functions) |
| `.env.local` | Override local para desarrollo |
| `.env.test` | URL fija para los tests |

### Con backend Docker (local)

```env
VITE_API_URL=http://localhost:8080
```

### Con emulador de Firebase

```env
VITE_API_URL=http://127.0.0.1:5001/fundacionpadi-41cb2/us-central1/api
```

> El backend Docker debe estar corriendo antes de levantar el frontend. Ver el README del backend.

## Desarrollo

El entorno de desarrollo se apoya en Vite, que proporciona Hot Module Replacement (HMR) para reflejar los cambios de forma inmediata durante la edición de páginas, componentes y estilos.

Para iniciar el servidor de desarrollo:

```bash
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

## Scripts disponibles

### Desarrollo

```bash
npm run dev
# o
npm start
```

Inicia el servidor de desarrollo en `http://localhost:5173`.

### Build de producción

```bash
npm run build
```

Compila la aplicación para producción en la carpeta `dist`.


## Tests

Las pruebas del frontend se ejecutan con Vitest y están organizadas en `test/`. Cubren utilidades puras y funciones del cliente HTTP, con soporte de cobertura y mocks globales.

### Correr los tests

```bash
# Modo watch (reejecutar al guardar cambios)
npm run test

# Ejecución única (ideal para CI)
npm run test:run

# Ejecución única con reporte de cobertura
npm run test:coverage
```

### Qué se testea

- **`utils/permissions.test.ts`**: funciones puras de `src/utils/permissions.ts`, verificando permisos por rol.
- **`api/*.test.ts`**: funciones del cliente HTTP en `src/api/`, verificando endpoints, parámetros, mapeo de datos y manejo de errores.

### Configuración de tests

- **Framework**: Vitest v3 en entorno `node`.
- **Configuración**: `vitest.config.ts` en la raíz del proyecto.
- **Variables de entorno**: `.env.test` define `VITE_API_URL=http://localhost:3000`.
- **Setup global**: `test/setup.ts` registra mocks de `localStorage` y `fetch`.
- **Mocking de módulos**: los archivos que usan el cliente axios (`api` de `./auth`) se mockean con `vi.mock` y `vi.hoisted`.

### Cobertura

```bash
npm run test:coverage
```

Genera reporte en terminal, `coverage/index.html` y `coverage/lcov.info`. El proyecto exige un mínimo de **70%** en líneas, funciones, branches y statements.

Los archivos medidos son `src/api/**` y `src/utils/**`. `src/api/auth.ts` está excluido porque funciona como infraestructura compartida.
