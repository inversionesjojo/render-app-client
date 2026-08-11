# 🔐 RenderVault | Portal del Cliente (client-app)

Este es el portal público e interactivo donde los clientes acceden a las especificaciones de sus proyectos, galerías multimedia y renderizados de modelos CAD 3D. 

---

## 🌟 Características Clave
- **Bloqueo Seguro por PIN:** Pantalla de desbloqueo glassmorphic con teclado numérico virtual, animaciones de error (vibración) y retroalimentación de tonos auditivos mediante Web Audio API.
- **Galería Multimedia Premium:** Cuadrícula responsiva que permite ampliar imágenes en pantalla completa mediante un Lightbox interactivo y reproducir videos.
- **Visor CAD 3D Interactivo:** Desarrollado con **TresJS** y **Three.js** para renderizar archivos `.stl` directamente en el navegador.
  - Rotación automática con ajuste de velocidad.
  - Selector de cuadrícula base y modo de estructura de alambre (wireframe).
  - Selector de colores personalizados y acabados de material (Mate, Cromo, Oro).
  - Cálculo en tiempo real de dimensiones físicas (X, Y, Z en mm) e integral de volumen (en cm³).

---

## 🛠️ Instalación y Configuración

### 1. Variables de Entorno (`.env`)
El portal del cliente se conecta a Supabase para recuperar la información del proyecto y los metadatos de los archivos cargados. Crea un archivo `.env` en este directorio o en la raíz del espacio de trabajo con las siguientes claves:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-publica
```

### 2. Instalación de Dependencias
Como la ejecución de comandos `npm` debe realizarse bajo entornos controlados, puedes instalar las dependencias usando una imagen de Docker:

```bash
docker run --rm -v ${PWD}:/app -w /app/client-app node:20-alpine npm install
```

Si prefieres instalar localmente en tu sistema (si cuentas con Node.js v20+):
```bash
npm install
```

---

## 🚀 Ejecución en Desarrollo y Producción

### Servidor de Desarrollo Local
Para iniciar el entorno de desarrollo y probar la interfaz en tiempo real (disponible en `http://localhost:5173`):

*Usando Docker:*
```bash
docker run --rm -it -v ${PWD}:/app -w /app/client-app -p 5173:5173 node:20-alpine npm run dev -- --host
```

*Usando el sistema local:*
```bash
npm run dev
```

### Compilación para Producción (Build)
Vite compilará y optimizará el código fuente, generando los archivos HTML/CSS/JS estáticos listos para producción dentro del directorio `dist/`:

*Usando Docker:*
```bash
docker run --rm -v ${PWD}:/app -w /app/client-app node:20-alpine npm run build
```

*Usando el sistema local:*
```bash
npm run build
```

---

## 🧭 Guía de Uso Paso a Paso

### 1. Acceso al Portal del Proyecto
- Abre tu navegador en la URL del proyecto asignado. Por ejemplo, en desarrollo: `http://localhost:5173/p/nombre-del-proyecto`.
- Si navegas a la página raíz (`http://localhost:5173`), verás un buscador central glassmorphic donde podrás escribir el slug de tu proyecto (`nombre-del-proyecto`) para acceder al portal.

### 2. Desbloqueo por PIN de Seguridad
- Una vez dentro de la URL del proyecto, verás la tarjeta de desbloqueo con el título del proyecto correspondiente.
- Introduce el PIN numérico de seguridad de 4 a 6 dígitos proporcionado por el administrador.
- El teclado generará sonidos de clic mecánicos. Si ingresas un código incorrecto, la tarjeta vibrará y emitirá un sonido grave de advertencia.
- Al ingresar el PIN correcto, el sistema lanzará un efecto visual de confeti y te dará acceso inmediato.

### 3. Galería de Archivos Multimedia
- En la pestaña **Media Files** (Archivos Multimedia), verás una cuadrícula de imágenes y videos del proyecto.
- Haz clic sobre cualquier imagen para abrir el visor lightbox en pantalla completa, permitiendo navegar entre archivos usando las flechas de la pantalla o del teclado.
- Los videos MP4, WebM o MOV se reproducirán en alta calidad con un reproductor interactivo incorporado.

### 4. Inspección del Modelo CAD 3D
- Haz clic en la pestaña **3D CAD Models** (Modelos CAD 3D).
- El visor TresJS cargará el archivo `.stl` alojado en Cloudflare R2.
- **Interacción de Cámara:** Haz clic izquierdo y arrastra para rotar la cámara; haz clic derecho y arrastra para desplazarla (pan); usa la rueda del mouse para hacer zoom.
- **Controles de Panel Flotante:**
  - Cambia la apariencia del modelo seleccionando los botones de acabado **MATTE (Mate)**, **CHROME (Cromo)** u **GOLD (Oro)**.
  - Selecciona un color de la paleta flotante para pintar el modelo.
  - Activa o desactiva la rotación automática del modelo y ajusta la velocidad mediante el control deslizante.
  - Alterna la visualización de la cuadrícula del suelo y ajusta la intensidad de la luz ambiental.
  - Consulta las dimensiones exactas en milímetros (Largo, Ancho, Alto) y el volumen físico estimado del objeto en la tarjeta de estadísticas del lado derecho.
