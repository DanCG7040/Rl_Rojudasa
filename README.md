# Torneo Rocket League - Rojudasa

Página web para el torneo de Rocket League construida con Astro, React y MongoDB Atlas.

## 🚀 Características

- **Diseño Moderno**: Animaciones fluidas inspiradas en portafolios modernos
- **Híbrido**: Páginas estáticas + API routes para MongoDB
- **Bracket Interactivo**: Visualización del bracket del torneo
- **Panel de Admin**: Gestión de datos del torneo desde MongoDB
- **Responsive**: Diseño adaptable a todos los dispositivos
- **Animaciones**: Efectos de scroll, fade-in, y hover

## 📦 Instalación

### Requisitos Previos

- Node.js 18.x o superior
- npm o yarn
- Cuenta en MongoDB Atlas (para producción)

### Librerías a Instalar

El proyecto utiliza las siguientes dependencias principales:

#### Dependencias de Producción:
```json
{
  "@astrojs/react": "^3.3.1",    // Integración de React con Astro
  "astro": "^4.5.0",              // Framework principal
  "dotenv": "^17.3.1",            // Manejo de variables de entorno
  "mongodb": "^7.1.0",            // Cliente de MongoDB
  "react": "^18.2.0",             // Biblioteca React
  "react-dom": "^18.2.0"          // React DOM para renderizado
}
```

#### Dependencias de Desarrollo:
```json
{
  "@types/react": "^18.2.43",     // Tipos TypeScript para React
  "@types/react-dom": "^18.2.17"  // Tipos TypeScript para React DOM
}
```

### Pasos de Instalación

1. **Clona el repositorio** (si aplica):
```bash
git clone <url-del-repositorio>
cd Rl-Rojudasa
```

2. **Instala las dependencias**:
```bash
npm install
```

Esto instalará automáticamente todas las librerías listadas en `package.json`.

3. **Configura las variables de entorno**:
   - Crea un archivo `.env` en la raíz del proyecto
   - Añade tu connection string de MongoDB Atlas:
   ```
   MONGODB_URI=mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/rl-rojudasa?retryWrites=true&w=majority
   MONGODB_DB_NAME=rl-rojudasa
   ```

4. **Inicia el servidor de desarrollo**:
```bash
npm run dev
```

5. **Abre tu navegador**:
   - Ve a [http://localhost:4321](http://localhost:4321)
   - El panel de administración está en [http://localhost:4321/admin](http://localhost:4321/admin)

## 📚 Librerías y sus Propósitos

### Framework y Core
- **Astro** (`^4.5.0`): Framework web moderno que permite crear sitios rápidos con componentes de múltiples frameworks
- **React** (`^18.2.0`): Biblioteca para construir interfaces de usuario interactivas
- **React DOM** (`^18.2.0`): Renderizador de React para el navegador

### Integración
- **@astrojs/react** (`^3.3.1`): Integrador oficial que permite usar componentes React dentro de Astro

### Base de Datos
- **mongodb** (`^7.1.0`): Driver oficial de MongoDB para Node.js, usado para conectar con MongoDB Atlas

### Utilidades
- **dotenv** (`^17.3.1`): Carga variables de entorno desde archivos `.env` de forma segura

### Desarrollo
- **@types/react** y **@types/react-dom**: Definiciones de tipos TypeScript para React, proporcionan autocompletado y verificación de tipos

## 🏗️ Construcción

Para generar la versión estática:

```bash
npm run build
```

Los archivos estáticos se generarán en la carpeta `dist/`

### Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción localmente
- `npm run test:mongodb` - Prueba la conexión a MongoDB

## 📁 Estructura del Proyecto

```
├── src/
│   ├── components/      # Componentes React
│   │   ├── Hero.tsx
│   │   ├── TournamentInfo.tsx
│   │   ├── Rules.tsx
│   │   └── Bracket.tsx
│   ├── layouts/         # Layouts de Astro
│   │   └── Layout.astro
│   ├── pages/           # Páginas
│   │   └── index.astro
│   └── styles/          # Estilos CSS
│       ├── hero.css
│       ├── info.css
│       ├── rules.css
│       └── bracket.css
├── astro.config.mjs     # Configuración de Astro
└── package.json
```

## ✏️ Personalización

### Modificar Equipos del Bracket

Edita el array `teams` en `src/components/Bracket.tsx`:

```tsx
const teams: Team[] = [
  { name: 'Tu Equipo 1', players: ['Jugador1', 'Jugador2', 'Jugador3'] },
  // ... más equipos
];
```

### Cambiar Información del Torneo

Modifica los datos en:
- `src/components/TournamentInfo.tsx` - Información general
- `src/components/Rules.tsx` - Reglas del torneo
- `src/components/Hero.tsx` - Título y fecha

### Colores

Los colores principales están definidos en `src/layouts/Layout.astro`:

```css
--primary-color: #ff6b35;
--secondary-color: #004e89;
--accent-color: #ffd23f;
```

## 🎨 Animaciones

Las animaciones incluyen:
- Fade-in al cargar
- Scroll animations (Intersection Observer)
- Hover effects en tarjetas
- Efectos de shimmer en títulos
- Transiciones suaves

## 🗄️ MongoDB Atlas Setup

1. Crea una cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea un cluster (gratis)
3. Ve a "Connect" > "Drivers" > "Node.js"
4. Copia la connection string
5. Reemplaza `<username>` y `<password>` con tus credenciales
6. Añade la URL a `.env` como `MONGODB_URI`

## 🚀 Deploy en Vercel

### Opción 1: Deploy desde GitHub (Recomendado)

1. Sube tu código a GitHub
2. Ve a [Vercel](https://vercel.com) e inicia sesión
3. Click en "New Project"
4. Importa tu repositorio de GitHub
5. Añade las variables de entorno:
   - `MONGODB_URI`: Tu connection string de MongoDB Atlas
   - `MONGODB_DB_NAME`: `rl-rojudasa` (opcional)
6. Click en "Deploy"

### Opción 2: Deploy desde CLI

```bash
npm i -g vercel
vercel
```

Sigue las instrucciones y añade las variables de entorno cuando te lo pida.

## 🔐 Panel de Administración

- URL: `/admin`
- Contraseña por defecto: `rojudasa2026`
- Cambia la contraseña en `src/components/AdminPanel.tsx` línea 4

## 📝 Licencia

© 2026 Torneo Rocket League Rojudasa
