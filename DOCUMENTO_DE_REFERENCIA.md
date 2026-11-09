# 📋 Documento de Referencia de Funcionalidades
## RenderVault | Portal del Cliente (`client-app`)

---

## 1. Resumen Ejecutivo y Propósito del Sistema

**RenderVault** es una solución web de alto rendimiento orientada a la entrega segura y profesional de proyectos técnicos, industriales y de diseño para clientes finales. Permite a los usuarios inspeccionar entregables que combinan galerías multimedia de alta definición (fotografías, renders y videos) con un **visor interactivo 3D CAD** de vanguardia ejecutado directamente en el navegador sin requerir la instalación de ningún software adicional.

El sistema garantiza confidencialidad y control mediante un portal con autenticación previa basada en PIN, diseñado con estética *glassmorphic* moderna, animaciones dinámicas, retroalimentación sonora sintetizada y optimización integral para dispositivos móviles y de escritorio.

---

## 2. Arquitectura de Software y Stack Tecnológico

El proyecto está estructurado como una Single Page Application (SPA) modular y desacoplada, orientada a la reactividad y al consumo eficiente de recursos en cliente:

```
┌─────────────────────────────────────────────────────────────┐
│                       RenderVault SPA                       │
│ ┌──────────────────────┬──────────────────────────────────┐ │
│ │  Vistas Principales  │       Componentes Núcleo         │ │
│ │  - Home.vue          │       - PinPrompt.vue            │ │
│ │  - ProjectPortal.vue │       - ImageVideoGallery.vue    │ │
│ │                      │       - ThreeDViewer.vue         │ │
│ │                      │       - STLModel.vue             │ │
│ └──────────┬───────────┴─────────────────┬────────────────┘ │
│            │                             │                  │
│     Vue Router (HTML5)            TresJS / Three.js         │
│            │                             │                  │
│            ▼                             ▼                  │
│    Supabase Client (DB)           WebGL / Canvas 3D         │
└─────────────────────────────────────────────────────────────┘
```

### Tecnologías Principales

| Categoría | Tecnología | Versión | Propósito |
| :--- | :--- | :--- | :--- |
| **Framework Base** | [Vue.js](https://vuejs.org/) | `v3.5.x` | Arquitectura basada en componentes con `<script setup>` y Composition API. |
| **Herramienta de Build** | [Vite](https://vitejs.dev/) | `v8.2.x` | Servidor de desarrollo ultrarrápido y empaquetador de producción. |
| **Renderizado 3D** | [Three.js](https://threejs.org/) | `v0.185.x` | Motor WebGL para renderizado de mallas, materiales PBR, cámaras y luces. |
| **Integración 3D Declarativa** | [@tresjs/core](https://tresjs.org/) / [@tresjs/cientos](https://cientos.tresjs.org/) | `v5.8.x` | Capa declarativa de Three.js para Vue 3 con control de ciclo de vida reactivo. |
| **Cargador CAD** | `STLLoader` (Three.js JSM) | Nativo | Carga, deserialización y normalización de geometrías STL binarias y ASCII. |
| **Backend & Storage** | [@supabase/supabase-js](https://supabase.com/) | `v2.109.x` | Consulta de metadatos del proyecto y URLs firmadas de almacenamiento (Cloudflare R2 / Supabase Storage). |
| **Efectos y Gamificación** | [canvas-confetti](https://www.npmjs.com/package/canvas-confetti) | `v1.9.x` | Lanzamiento de partículas de confeti aceleradas por GPU en autenticación exitosa. |
| **Iconografía** | [lucide-vue-next](https://lucide.dev/) | `v1.0.x` | Iconos vectoriales consistentes y accesibles. |
| **Audio Nativo** | Web Audio API | Nativo | Síntesis acústica sinusoidal para clics mecánicos, advertencias y confirmaciones. |
| **Infraestructura** | Docker / Nginx Alpine | Alpine | Contenedor de producción con compresión y políticas de caché HTTP. |

---

## 3. Catálogo Detallado de Funcionalidades Desarrolladas

### 3.1. Sistema de Acceso y Puerta de Seguridad (*Gatekeeper*)

#### 3.1.1. Búsqueda y Enrutamiento por Slug (`Home.vue`)
- **Landing Central Glassmorphic:** Interfaz con efectos de iluminación ambiente mediante orbes degradados difusos (`glow-orb`).
- **Limpieza y Normalización de Entrada:** Al ingresar el código o slug del proyecto, se eliminan caracteres especiales mediante expresiones regulares sanitizadas:
  $$\text{cleanSlug} = \text{input}.\text{trim}().\text{toLowerCase}().\text{replace}(/[\text{^}a\text{-}z0\text{-}9\text{-}\_]/g, \text{""})$$
- **Navegación Dinámica:** Redirección automática a la ruta SPA `/p/:slug`.

#### 3.1.2. Módulo de Autenticación por PIN (`PinPrompt.vue`)
- **Adaptabilidad de Longitud:** El componente inspecciona la longitud requerida (`expectedPin.length`) y ajusta dinámicamente los círculos indicadores de entrada (*dots*).
- **Teclado Táctil Virtual Numérico:** Botonera interactiva del 0 al 9, botón de borrado total (`C`) y botón de retroceso unitario (*backspace*) con icono SVG.
- **Sintetizador Acústico Web Audio API:**
  - *Clic de tecla:* Frecuencia media de $600\,\text{Hz}$ durante $35\,\text{ms}$ con caída exponencial en ganancia.
  - *Tono de error:* Frecuencia grave tipo diente de sierra (*sawtooth*) a $160\,\text{Hz}$ durante $250\,\text{ms}$ simulando un sonido de acceso denegado.
  - *Tono de éxito:* Frecuencia sinusoidal brillante a $880\,\text{Hz}$ (nota La5) durante $150\,\text{ms}$.
- **Animaciones de Estado:**
  - Ante intento fallido: Disparo de animación CSS `animate-shake` con traslaciones horizontales alternadas en 600 ms y reinicio de buffer de PIN.
  - Ante intento exitoso: Animación de cambio de icono de candado cerrado a candado abierto y propagación del evento `@unlock-success`.
- **Efecto Celebración con Confeti:** En [`ProjectPortal.vue`](src/views/ProjectPortal.vue), al recibir la confirmación de desbloqueo, se disparan 100 partículas de confeti en colores violeta, cian y esmeralda (`#8b5cf6`, `#06b6d4`, `#10b981`).
- **Persistencia de Sesión:** Almacenamiento seguro en el ámbito de la sesión del navegador mediante `sessionStorage.setItem('unlocked_${slug}', 'true')`, permitiendo al usuario navegar o refrescar la página sin requerir reingresar el PIN hasta que cierre la pestaña o pulse el botón **Lock Portal**.

---

### 3.2. Galería Multimedia Inteligente & Lightbox

#### 3.2.1. Cuadrícula de Contenidos (`ImageVideoGallery.vue`)
- **Detección Automática de Tipo de Archivo:** Clasificación automática entre imágenes (`image`) y secuencias audiovisuales (`video`).
- **Visualizador de Videos con Indicador Superpuesto:** Previsualización con metadata precargada y badge de reproducción animado.
- **Formateo Dinámico de Tamaños:** Conversión matemática legible de tamaños expresados en bytes a `KB`, `MB` o `GB`:
  $$\text{Tamaño} = \frac{\text{bytes}}{1024^i}$$
- **Estados Vacíos con Estilo:** Renderizado de panel informativo en caso de proyectos que no dispongan de archivos multimedia cargados.

#### 3.2.2. Visor Lightbox en Pantalla Completa
- **Navegación Táctil y por Teclado:**
  - Flecha izquierda ($\leftarrow$) / Botón Prev: Ítem anterior con wrap-around circular.
  - Flecha derecha ($\rightarrow$) / Botón Next: Siguiente ítem con wrap-around circular.
  - Tecla Escape ($\text{Esc}$) / Clic en el telón de fondo: Cierre inmediato del visor.
- **Reproducción Audiovisual Integrada:** Los videos se abren con soporte completo de controles (`controls`) y reproducción asistida.
- **Metadatos en Pie de Foto:** Despliegue de tipo de medio, nombre original del archivo, peso en disco e índice actual vs total (`índice + 1 / total`).

#### 3.2.3. Motor de Descargas Universales (`src/utils/download.js`)
- **Descarga Asíncrona Seguro Cross-Origin:** 
  1. Realiza una petición `fetch(url)` en segundo plano.
  2. Convierte la respuesta en un `Blob` binario en memoria.
  3. Genera una URL de objeto temporal con `window.URL.createObjectURL(blob)`.
  4. Crea un elemento ancla `<a>` programático, define el atributo `download` con el nombre de archivo designado y fuerza el evento `.click()`.
  5. Revoca la URL temporal tras $1500\,\text{ms}$ para evitar fugas de memoria (*memory leaks*).
  6. En caso de restricciones CORS estrictas que bloqueen el fetch en el navegador cliente, activa automáticamente una degradación elegante (*fallback*) abriendo el enlace directo en una pestaña segura con `rel="noopener noreferrer"`.
- **Botones de Descarga en Múltiples Puntos:** Integrados con spinners de carga en:
  - Cada miniatura de la cuadrícula multimedia.
  - La barra de encabezado del modal Lightbox.
  - Los selectores de modelos 3D y la barra de herramientas táctil.

---

### 3.3. Visor CAD 3D Interactivo de Nueva Generación

El visor 3D es el módulo más complejo y potente de la aplicación, implementado a través de los componentes [`ThreeDViewer.vue`](src/components/ThreeDViewer.vue) y [`STLModel.vue`](src/components/STLModel.vue).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ThreeDViewer.vue                                │
│                                                                        │
│  [Tabs: Modelo 1 | Modelo 2]                    [Fullscreen / Download]│
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ TresCanvas (WebGL)                                                 │ │
│ │  ├─ PerspectiveCamera (4, 4, 4)                                    │ │
│ │  ├─ OrbitControls (Rotar / Pan / Damping / Dynamic Touch)          │ │
│ │  ├─ Iluminación: AmbientLight + Directional (3 Presets)            │ │
│ │  ├─ GridHelper (12x12)                                             │ │
│ │  └─ STLModel.vue                                                   │ │
│ │      ├─ useLoader(STLLoader) -> BufferGeometry                     │ │
│ │      ├─ Centrado geométrico local + computeVertexNormals           │ │
│ │      ├─ Auto-escalado proporcional (maxDimension -> 3.0)           │ │
│ │      ├─ Materiales PBR: Matte / Chrome / Gold                      │ │
│ │      └─ Métricas: Bounding Box mm & Integral de Volumen cm³        │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  [Toolbar Táctil: 1-Dedo Rotar/Pan | Zoom +/- | Recentrar | Nudge Pad] │
└────────────────────────────────────────────────────────────────────────┘
```

#### 3.3.1. Soporte Multi-Modelo CAD
- Permite renderizar proyectos que posean más de un archivo STL.
- Barra de pestañas superior interactiva con identificación del nombre de la pieza.
- Botón de descarga rápida individual junto al selector de pestaña.
- Reseteo automático de estados de carga, estadísticas geométricas y orientación al alternar entre piezas.

#### 3.3.2. Carga, Deserialización y Ajuste Geométrico Inteligente (`STLModel.vue`)
- **Procesamiento de BufferGeometry:** Soporta tanto archivos STL binarios como en formato ASCII.
- **Centrado al Origen Local:** Ejecución de `geom.center()` para garantizar que el centro geométrico del objeto coincida con $(0, 0, 0)$, permitiendo rotaciones libres de excentricidad.
- **Recálculo de Normales:** Ejecución de `geom.computeVertexNormals()` para eliminar facetas duras no deseadas y garantizar un sombreado suave con luces PBR.
- **Smart-Fit (Auto-escalado):** 
  Para evitar que piezas diseñadas en escalas gigantescas o microscópicas desborden la cámara, el sistema calcula el factor de escala:
  $$\text{maxDim} = \max(\text{size}_x, \text{size}_y, \text{size}_z)$$
  $$\text{scaleFactor} = \frac{3.0}{\text{maxDim}}$$
  Garantizando que cualquier pieza encaje perfectamente dentro de un volumen acotado de 3 unidades en pantalla sin alterar sus proporciones físicas reales.

#### 3.3.3. Cálculo Matemático de Dimensiones Físicas y Volumen
El visor calcula métricas exactas y las emite al panel de información:

1. **Dimensiones de Caja Envolvente (Bounding Box):**
   Calcula la anchura, longitud y altura reales del objeto en milímetros con precisión decimal:
   $$\text{Dimensiones} = \{ X: \text{size}_x\,\text{mm},\, Y: \text{size}_y\,\text{mm},\, Z: \text{size}_z\,\text{mm} \}$$

2. **Integral de Volumen con Signo (Volumen en $\text{cm}^3$):**
   A partir de los triángulos de la malla indexada o no indexada, calcula el volumen exacto integrando el producto mixto de cada tetraedro formado por los tres vértices $(p_1, p_2, p_3)$ y el origen:
   $$V_{\text{tetraedro}} = \frac{p_1 \cdot (p_2 \times p_3)}{6.0}$$
   $$V_{\text{total}} = \frac{\left| \sum_{i=1}^{N} V_{\text{tetraedro}_i} \right|}{1000} \quad [\text{cm}^3]$$
   *(Dividido entre 1000 para convertir $\text{mm}^3$ a $\text{cm}^3$).*

#### 3.3.4. Alineación y Orientación Espacial CAD
En software CAD (SolidWorks, AutoCAD, Fusion360, Blender), el eje vertical suele definirse como $+Z$ (*Z-Up*), mientras que en entornos de gráficos por computadora (Three.js/WebGL) el eje vertical es $+Y$ (*Y-Up*). 

El sistema implementa una matriz de corrección reactiva:
- **CAD Z-UP (Defecto):** Rota la malla en $-90^\circ$ sobre el eje X ($-\pi / 2$), colocando la pieza erguida naturalmente.
- **Modo Original:** Mantiene la orientación cruda del archivo STL.
- **Rotación Yaw de 90°:** Aplica rotaciones incrementales de $+90^\circ$ sobre el eje de elevación para orientar frentes y laterales.
- **Inversión de Eje (Flip):** Permite invertir la pieza en $180^\circ$ ($\pi$) para inspeccionar bases y caras inferiores.

#### 3.3.5. Sistema de Iluminación Tridimensional y Posicionamiento Dinámico
El entorno 3D implementa un esquema de iluminación de múltiples fuentes:
- **Luz Ambiental (`TresAmbientLight`):** Iluminación base sin sombras, con control de intensidad deslizable desde $0.2\times$ hasta $2.0\times$.
- **Luz Puntual (`TresPointLight`):** Ubicada cenitalmente en $(0, 5, 0)$ para proporcionar iluminación suave en cavidades superiores.
- **Sistema de Luces Direccionales con Gestión de Posición:**
  Permite al cliente alternar entre 3 escenarios de iluminación según la geometría que desee inspeccionar:
  
  | Posición | Coordenadas Luz Principal | Coordenadas Luz de Relleno | Descripción |
  | :--- | :--- | :--- | :--- |
  | **Lateral** | $[+8, 12, 8]$ | $[-8, -8, -8]$ | Iluminación lateral derecha estándar que resalta volumen y relieves. |
  | **Centro** | $[0, 12, 8]$ | $[0, -8, -8]$ | Iluminación cenital equilibrada frontal sin sombras oblicuas. |
  | **Contrario** | $[-8, 12, 8]$ | $[+8, -8, -8]$ | Iluminación desde el flanco izquierdo para inspeccionar caras opuestas. |

- **Alternancia Táctil Rápida con Feedback:** Botón en la barra de herramientas táctil móvil que cicla cíclicamente entre `Lateral -> Centro -> Contrario` con notificación visual flotante temporal (*badge notice*) de $1.8\,\text{s}$.

#### 3.3.6. Presets de Materiales PBR y Paleta de Colores
Utiliza `MeshStandardMaterial` de Three.js con propiedades físicas personalizables:
- **MATTE:** Metalness $0.2$, Roughness $0.75$ (acabado plástico técnico o resina mate).
- **CHROME:** Metalness $0.95$, Roughness $0.08$, Clearcoat $1.0$, ClearcoatRoughness $0.1$ (acabado metálico espejo con barniz de alto brillo).
- **GOLD:** Metalness $0.9$, Roughness $0.15$, Clearcoat $0.5$ y tonalidad base dorada pulida (`#f59e0b`).
- **Selector de Colores:** 6 colores predefinidos de alto contraste (Violeta, Cian, Esmeralda, Rojo, Ámbar y Pizarra).

#### 3.3.7. Experiencia Táctil y Móvil Optimizada (Touch Suite)
Para resolver las fricciones tradicionales de la navegación 3D en pantallas táctiles de smartphones y tablets:

1. **Selector de Modo a 1 Dedo:**
   - **Modo Rotación (`TOUCH.ROTATE`):** Arrastrar con un dedo rota la vista orbital alrededor del modelo.
   - **Modo Desplazamiento (`TOUCH.PAN`):** Arrastrar con un dedo desplaza lateralmente el objeto y la cámara sin rotar (*Panning*). Al activar este modo, la rotación automática se pausa automáticamente para evitar saltos.
2. **Zoom In (+) y Zoom Out (-):**
   Botones dedicados que recalculan la distancia vectorial de la cámara respecto al foco objetivo, reduciendo la distancia en un $20\%$ o expandiéndola en un $25\%$.
3. **Recentrado de Cámara:**
   Restaura el objetivo focal al centro $(0, 0, 0)$ y reposiciona la cámara en su ángulo isométrico ideal $(4, 4, 4)$ con enfoque instantáneo.
4. **Pad Direccional de Desplazamiento Fino (*Nudge Pad*):**
   Panel cruceta emergente que calcula el desplazamiento en el espacio del mundo utilizando la matriz ortonormal de la cámara:
   $$\vec{d} = \text{offset}_x \cdot \vec{\text{right}} + \text{offset}_y \cdot \vec{\text{up}}$$
   Permitiendo micro-pasos precisos en las 4 direcciones espaciales.
5. **Modo Pantalla Completa:**
   Invoca la API de pantalla completa del navegador (`requestFullscreen`) directamente sobre el contenedor del visor 3D, expandiendo el lienzo visual al $100\%$ del dispositivo.
6. **Paneles Laterales Colapsables:**
   En pantallas menores a $768\,\text{px}$, los paneles flotantes de ajustes y de medidas se ocultan por defecto y disponen de botones de apertura rápida y cierres individuales.

#### 3.3.8. Manejo de Errores y Reintentos
- **Capa de Carga Absoluta:** Mientras el archivo STL es descargado y procesado, se muestra un spinner glassmorphic con aviso de proceso geométrico.
- **Boundary de Fallo de Red o Carga:** Si la URL expira o el modelo falla al deserializarse, el visor captura el error sin romper la aplicación, presentando un mensaje descriptivo y un botón interactivo de **Reintentar** que fuerza la recarga del componente mediante claves reactivas incrementales (`reloadTrigger`).
- **Comportamiento de Rotación por Defecto:** Desactivado por defecto (`autoRotate = false`) tras optimización de usabilidad, evitando mareo o distracciones al inspeccionar medidas, pero disponible con control deslizante de velocidad ($0.5\times$ a $8\times$).

---

## 4. Especificación Técnica de Componentes

### 4.1. `PinPrompt.vue`
| Propiedad | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `projectTitle` | `String` | Sí | Nombre del proyecto que se desplegará en la tarjeta de acceso. |
| `expectedPin` | `String` | Sí | Código PIN de seguridad esperado para validar el ingreso. |

| Evento | Payload | Descripción |
| :--- | :--- | :--- |
| `unlock-success` | Ninguno | Se emite cuando el usuario ingresa satisfactoriamente el código correcto. |

---

### 4.2. `ImageVideoGallery.vue`
| Propiedad | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `mediaList` | `Array` | Sí | Lista de objetos multimedia `{ id, name, type, url, size }`. |

| Funciones Clave | Descripción |
| :--- | :--- |
| `openLightbox(index)` | Abre el modal en el índice especificado y vincula listeners de teclado. |
| `closeLightbox()` | Cierra el modal y remueve listeners del ciclo de vida. |
| `handleDownload(item)` | Dispara la utilidad de descarga asíncrona cross-origin. |

---

### 4.3. `ThreeDViewer.vue`
| Propiedad | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `modelList` | `Array` | Sí | Lista de modelos CAD `{ id, name, url, type: '3d' }`. |

| Estado Reactivo Clave | Tipo | Valor Inicial | Descripción |
| :--- | :--- | :--- | :--- |
| `activeModelIndex` | `Number` | `0` | Índice del modelo STL actualmente visualizado. |
| `touchMode` | `String` | `'rotate'` | Modalidad de interacción táctil con 1 dedo (`'rotate'` o `'pan'`). |
| `lightPosition` | `String` | `'lateral'` | Disposición espacial de la luz principal (`'lateral'`, `'center'`, `'opposite'`). |
| `modelOrientation` | `String` | `'z-up'` | Ajuste de orientación de la pieza (`'z-up'` o `'original'`). |
| `materialPreset` | `String` | `'matte'` | Acabado de la superficie (`'matte'`, `'chrome'`, `'gold'`). |
| `showNudgePad` | `Boolean` | `false` | Visibilidad del pad de desplazamiento táctil fino. |

---

### 4.4. `STLModel.vue`
| Propiedad | Tipo | Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `url` | `String` | (Obligatorio) | Enlace de descarga del archivo binario o ASCII STL. |
| `materialStyle`| `String` | `'matte'` | Estilo de material a compilar en `TresMeshStandardMaterial`. |
| `color` | `String` | `'#8b5cf6'` | Código hexadecimal para pintar la superficie. |
| `orientation` | `String` | `'z-up'` | Modo de rotación de ejes (`'z-up'` o `'original'`). |
| `yaw` | `Number` | `0` | Ángulo de rotación horizontal adicional en radianes. |
| `flip` | `Boolean` | `false` | Inversión axial de 180° ($\pi$ rad). |

| Evento | Payload | Descripción |
| :--- | :--- | :--- |
| `model-loaded` | `{ dimensions: { x, y, z }, volume }` | Emite las dimensiones en milímetros y volumen en centímetros cúbicos. |
| `model-error` | `Error` | Emite la excepción producida durante la deserialización geométrica. |

---

## 5. Esquema de Datos y Modelo en Supabase

El cliente consume la tabla relacional `projects` expuesta a través del cliente Supabase configurado con la clave anónima pública:

### Tabla `projects`

```sql
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  slug text not null unique,
  title text not null,
  pin text not null,
  media jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### Estructura del Objeto JSON en `media`
Cada elemento del arreglo JSON `media` cuenta con los siguientes atributos:

```json
[
  {
    "id": "e4f8b2d1-0001-49b8-b80c-000000000001",
    "name": "render_perspectiva_frontal.png",
    "type": "image",
    "url": "https://pub-r2.dominio.com/renders/render_frontal.png",
    "size": 2457812
  },
  {
    "id": "e4f8b2d1-0002-49b8-b80c-000000000002",
    "name": "video_ensamble_mecanico.mp4",
    "type": "video",
    "url": "https://pub-r2.dominio.com/videos/ensamble.mp4",
    "size": 18945620
  },
  {
    "id": "e4f8b2d1-0003-49b8-b80c-000000000003",
    "name": "carcasa_superior_v2.stl",
    "type": "3d",
    "url": "https://pub-r2.dominio.com/models/carcasa_superior.stl",
    "size": 8412500
  }
]
```

---

## 6. Historial de Evolución y Mejoras Recientes

A continuación se resume la evolución cronológica de las funcionalidades implementadas en el repositorio:

1. **`1dba6ed` - Código Base Inicial:**
   - Creación del portal SPA con Vue 3, Vite y Supabase.
   - Implementación de la pantalla de inicio `Home.vue` y portal `ProjectPortal.vue`.
   - Primera versión del teclado numérico PIN con Web Audio API.
   - Galería multimedia inicial con visor lightbox.
   - Visor 3D inicial con TresJS y Three.js.
2. **`2e20bdb` - Documentación y Scripts:**
   - Estructuración inicial de documentación y comandos del `Makefile`.
3. **`2a1f150` - Actualización de Visor 3D y Botón de Descarga:**
   - Creación de la utilidad `downloadResource` en `src/utils/download.js` para descargas asíncronas con compatibilidad CORS.
   - Botón de descarga en cada tarjeta de imagen/video y en el modal lightbox.
   - Suite completa de controles móviles para el visor 3D (modo 1-dedo rotar/desplazar, zoom digital, recentrado, pad de desplazamiento direccional y modo fullscreen).
   - Controles de orientación CAD Z-Up, rotación Yaw de 90° e inversión Flip.
   - Botón de descarga directa de archivos STL en el panel de medidas y en la barra de herramientas táctil.
4. **`e288dee` - Soporte de Refresco en Vercel:**
   - Incorporación de `vercel.json` con reescrituras de rutas dinámicas hacia `/index.html` para solventar errores 404 al recargar el navegador en URLs profundas (`/p/:slug`).
5. **`a774c30` - Soporte Multi-Vista 3D:**
   - Implementación del selector de pestañas para proyectos con múltiples modelos STL, permitiendo alternar entre diferentes piezas y descargarlas individualmente.
6. **`2ac7295` - Gestión de Posición de Iluminación:**
   - Implementación del selector de 3 posiciones para la luz direccional principal y secundaria: `Lateral` ($X=+8$), `Centro` ($X=0$) y `Contrario` ($X=-8$).
   - Botón táctil con alternancia cíclica y notificación flotante temporal (*badge notice*).
7. **`f480612` - Desactivación de Rotación Automática por Defecto:**
   - Configuración de `autoRotate` en `false` por defecto para proporcionar una inspección visual estable e inmediata al cargar el modelo CAD, manteniendo disponible su activación manual con ajuste de velocidad.
