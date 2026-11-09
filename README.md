# 🔐 RenderVault | Portal del Cliente (client-app)

RenderVault es el portal interactivo y seguro de entrega de proyectos para clientes, especializado en la visualización e inspección de especificaciones técnicas, galerías multimedia de alta fidelidad y renderizado de modelos CAD 3D interactivos en tiempo real directamente en el navegador.

> 📖 **Documento de Referencia Técnica:** Para conocer la arquitectura en profundidad, especificación de componentes (props/eventos), fórmulas de cálculo y flujos funcionales, consulta el [Documento de Referencia de Funcionalidades](DOCUMENTO_DE_REFERENCIA.md).

---

## 🌟 Características Principales

### 🔒 1. Acceso Seguro con Protección por PIN (Gatekeeper)
- **Búsqueda por Slug:** Acceso directo a proyectos mediante URL amigable (`/p/:slug`) o buscador en la pantalla inicial con normalización automática de texto.
- **Teclado Numérico Virtual:** Interfaz glassmorphic con teclado táctil responsivo, indicador visual de puntos de contraseña de longitud dinámica según la clave del proyecto.
- **Retroalimentación Auditiva con Web Audio API:** Síntesis sonora nativa en el navegador que genera clics mecánicos al pulsar teclas, tono grave de advertencia ante errores y sonido armónico de desbloqueo.
- **Animaciones e Interacciones:** Efecto de sacudida (*shake animation*) ante PIN incorrecto y lanzamiento de confeti multicolor interactivo (*canvas-confetti*) al superar la autenticación.
- **Persistencia de Sesión:** Mantenimiento del estado de desbloqueo durante la sesión de la pestaña (`sessionStorage`) y botón para volver a bloquear el portal en cualquier momento.

### 🖼️ 2. Galería Multimedia Inteligente & Lightbox
- **Cuadrícula Adaptativa:** Visualización responsiva de imágenes (`.png`, `.jpg`, `.webp`) y videos (`.mp4`, `.webm`, `.mov`).
- **Reproducción Integrada:** Previsualizaciones de video con indicador de reproducción y visor con controles nativos de alta calidad.
- **Lightbox en Pantalla Completa:** Navegación fluida entre elementos mediante clics, gestos, flechas en pantalla o atajos de teclado (← / → / Esc).
- **Descargas Directas y Seguras:** Botón de descarga con indicador de progreso integrado en cada tarjeta y en la cabecera del Lightbox, respaldado por un gestor que resuelve blobs cross-origin con fallback a enlaces directos.

### 🧊 3. Visor CAD 3D Interactivo de Nueva Generación
Desarrollado sobre **TresJS** y **Three.js** con soporte completo para geometrías STL:
- **Soporte Multi-Modelo:** Selector de pestañas superiores para alternar entre diferentes piezas CAD dentro de un mismo proyecto, con botón de descarga individual por archivo.
- **Alineación y Orientación CAD:**
  - Modo **CAD Z-UP** (alinea el eje Z vertical erguido, estándar en software de ingeniería y slicers de impresión 3D).
  - Modo **Original** (orientación Y-UP nativa de Three.js).
  - Rotación rápida en el plano horizontal (Yaw en pasos de 90°).
  - Inversión de cara/eje (Flip de 180°).
- **Gestión Avanzada de Iluminación:**
  - 3 posiciones preestablecidas para la luz principal y luz de relleno: **Lateral** (defecto), **Centro** (cenital) y **Contrario** (lado opuesto).
  - Control cíclico de iluminación desde la barra táctil con notificación visual flotante.
  - Ajuste en tiempo real de la intensidad de la luz ambiental.
- **Materiales PBR y Personalización:**
  - Presets de acabado: **MATTE** (Mate difuso), **CHROME** (Cromo reflectante con capa transparente) y **GOLD** (Oro metalizado).
  - Paleta de colores seleccionables en tiempo real para pintar el modelo.
- **Métricas Físicas en Tiempo Real:**
  - Medición milimétrica precisa en los tres ejes ($X, Y, Z$ en mm) basada en la caja envolvente (*Bounding Box*).
  - Cálculo del volumen físico aproximado en centímetros cúbicos ($\text{cm}^3$) mediante la integral de volumen con signo de tetraedros triangulares.
- **Barra de Herramientas Táctil y Móvil:**
  - Selector de interacción táctil con 1 dedo: **Modo Rotación** (`TOUCH.ROTATE`) vs. **Modo Desplazamiento** (`TOUCH.PAN`).
  - Botones táctiles de **Zoom In (+)** y **Zoom Out (-)** programáticos.
  - Botón de **Recentrado de Cámara** para enfocar el objeto a la distancia óptima.
  - **Pad Direccional (*Nudge Pad*):** Control cruceta para realizar micro-desplazamientos finos en las 4 direcciones espaciales.
  - Modo **Pantalla Completa** (*Fullscreen API*) para maximizar el área de inspección 3D.
- **Tolerancia a Fallos y Rendimiento:**
  - Centrado geométrico al origen local y recálculo automático de normales de vértices.
  - Auto-escalado inteligente (*Smart-fit*) que normaliza piezas de cualquier escala.
  - Detección de errores en la descarga del modelo con botón interactivo de reintento (*Retry*).
  - Rotación automática desactivada por defecto para permitir una inspección precisa, con opción de activación y control deslizante de velocidad.

---

## 🛠️ Requisitos e Instalación

### Requisitos Previos
- [Node.js](https://nodejs.org/) v20+ o [Docker](https://www.docker.com/) instalado en el sistema.
- Proyecto activo en [Supabase](https://supabase.com/).

### 1. Variables de Entorno (`.env`)
Crea un archivo `.env` en la raíz de `render-app-client`:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-publica
```

### 2. Instalación de Dependencias

**Con Makefile / Docker (entorno aislado sin ensuciar el host):**
```bash
make dev-install
```

**De forma local nativa con npm:**
```bash
npm install
```

---

## 🚀 Flujo de Desarrollo

El proyecto cuenta con recetas automatizadas en el `Makefile` para agilizar el ciclo de trabajo:

| Comando | Descripción |
| :--- | :--- |
| `make dev-install` | Instala dependencias dentro de un contenedor Node 20 Alpine. |
| `make dev-run` | Inicia el servidor de desarrollo Vite expuesto en `http://localhost:5173`. |
| `make audit` | Ejecuta `npm audit` para revisar vulnerabilidades de dependencias. |

También puedes ejecutar los comandos directamente con tu gestor local:
```bash
# Iniciar servidor de desarrollo con Hot Module Replacement (HMR)
npm run dev

# Compilar para producción
npm run build

# Previsualizar el build de producción localmente
npm run preview
```

---

## 🌐 Despliegue en Producción

### Opción A: Contenedor Docker con Servidor Nginx
El archivo [`Dockerfile`](Dockerfile) implementa una compilación multi-etapa (*multi-stage build*) con imagen base ultra liviana `nginx:alpine` y reglas de caché optimizadas para Single Page Applications:

```bash
# 1. Construir la imagen Docker pasando las credenciales de Supabase
docker build \
  --build-arg VITE_SUPABASE_URL="https://tu-proyecto.supabase.co" \
  --build-arg VITE_SUPABASE_ANON_KEY="tu-clave-anonima-publica" \
  -t rendervault-client .

# 2. Ejecutar el contenedor sirviendo en el puerto 8080 (o el puerto deseado)
docker run -d --name rendervault-client -p 8080:80 rendervault-client
```

### Opción B: Despliegue en Vercel
El repositorio incluye [`vercel.json`](vercel.json) con reescrituras automáticas para garantizar que el enrutador de Vue Router (History API) resuelva cualquier ruta de proyecto (`/p/:slug`) al refrescar el navegador sin emitir errores 404:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 🗄️ Estructura del Proyecto

```text
render-app-client/
├── public/                 # Favicon y assets estáticos públicos
├── src/
│   ├── assets/             # Estilos e imágenes del proyecto
│   ├── components/         # Componentes modulares del cliente
│   │   ├── ImageVideoGallery.vue # Galería con lightbox y descargas
│   │   ├── PinPrompt.vue         # Puerta de seguridad con teclado y Web Audio
│   │   ├── STLModel.vue          # Carga de geometría STL, PBR y cálculo físico
│   │   └── ThreeDViewer.vue      # Escena 3D, luces, multi-modelo y controles táctiles
│   ├── router/
│   │   └── index.js        # Configuración de Vue Router (HTML5 History)
│   ├── utils/
│   │   └── download.js     # Utilidad de descarga universal de archivos
│   ├── views/
│   │   ├── Home.vue        # Landing de búsqueda de proyectos por slug
│   │   └── ProjectPortal.vue # Dashboard principal del proyecto autenticado
│   ├── App.vue             # Componente raíz
│   ├── main.js             # Punto de entrada de la aplicación
│   ├── style.css           # Tokens de diseño y utilidades Glassmorphism
│   └── supabase.js         # Inicialización del cliente Supabase
├── Dockerfile              # Construcción multi-stage y servidor Nginx Alpine
├── Makefile                # Automatización de tareas de desarrollo y auditoría
├── nginx.conf              # Configuración SPA con caché para Nginx
├── vercel.json             # Reglas de reescritura para despliegue en Vercel
├── DOCUMENTO_DE_REFERENCIA.md # Especificación técnica y catálogo de funcionalidades
└── README.md               # Esta documentación
```

---

## 📚 Documentación Adicional
Para consultar el catálogo exhaustivo de todas las funcionalidades desarrolladas, explicación detallada de cada componente, interfaces de props, eventos y cálculos de volumen y orientación 3D, revisa el archivo [DOCUMENTO_DE_REFERENCIA.md](DOCUMENTO_DE_REFERENCIA.md).
