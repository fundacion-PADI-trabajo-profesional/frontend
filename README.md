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
