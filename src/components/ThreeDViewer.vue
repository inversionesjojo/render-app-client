<template>
  <div class="viewer-container" :class="{ 'is-fullscreen': isFullscreen }" ref="viewerContainerRef">
    <!-- Multiple model selector tab (if project has > 1 STL model) -->
    <div v-if="modelList.length > 1" class="model-tabs">
      <div 
        v-for="(model, idx) in modelList" 
        :key="model.id || idx"
        class="model-tab-item"
      >
        <button 
          class="model-tab-btn" 
          :class="{ 'active': activeModelIndex === idx }"
          @click="activeModelIndex = idx"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          {{ model.name }}
        </button>
        <button 
          class="model-tab-download-btn"
          @click.stop="downloadModelItem(model)"
          :title="`Descargar ${model.name}`"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
      </div>
    </div>

    <!-- Active 3D Canvas Space -->
    <div class="canvas-wrapper" ref="canvasWrapperRef">
      <TresCanvas 
        v-if="currentModel"
        clear-color="#0b0f19" 
        shadows 
        alpha
      >
        <TresPerspectiveCamera ref="cameraRef" :position="[4, 4, 4]" :look-at="[0, 0, 0]" />
        
        <!-- Camera Controls with Dynamic Touch Configuration -->
        <OrbitControls 
          ref="orbitControlsRef"
          :enable-damping="true"
          :damping-factor="0.05"
          :auto-rotate="effectiveAutoRotate"
          :auto-rotate-speed="autoRotateSpeed"
          :enable-pan="true"
          :enable-zoom="true"
          :screen-space-panning="true"
          :touches="touchConfig"
        />
        
        <!-- Lights -->
        <TresAmbientLight :intensity="ambientIntensity" />
        <TresDirectionalLight 
          ref="mainLightRef"
          :position="mainLightPosition" 
          :intensity="1.5" 
          cast-shadow 
        />
        <TresDirectionalLight 
          ref="fillLightRef"
          :position="fillLightPosition" 
          :intensity="0.6" 
        />
        <TresPointLight :position="[0, 5, 0]" :intensity="0.5" />
        
        <!-- Grid Helper -->
        <TresGridHelper v-if="showGrid" :args="[12, 12, '#4f46e5', '#1f2937']" :position="[0, -1.5, 0]" />

        <!-- 3D Model with loader boundary & Orientation Props -->
        <Suspense>
          <template #default>
            <STLModel 
              :key="(currentModel.id || currentModel.url) + '_' + activeModelIndex + '_' + reloadTrigger"
              :url="currentModel.url"
              :material-style="materialPreset"
              :color="selectedColor"
              :orientation="modelOrientation"
              :yaw="modelYaw"
              :flip="modelFlip"
              @model-loaded="handleModelLoaded"
              @model-error="handleModelError"
            />
          </template>
          <template #fallback>
            <!-- Handled by HTML absolute loader wrapper outside canvas -->
            <TresMesh>
              <TresBoxGeometry :args="[1, 1, 1]" />
              <TresMeshBasicMaterial color="#374151" wireframe />
            </TresMesh>
          </template>
        </Suspense>
      </TresCanvas>

      <!-- Floating Absolute Loading / Error Overlay -->
      <div v-if="isModelLoading || modelLoadError" class="canvas-loader-overlay">
        <template v-if="modelLoadError">
          <div class="error-badge-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <p class="error-load-title">Error al cargar modelo 3D</p>
          <p class="error-load-text">{{ modelLoadError }}</p>
          <button class="btn btn-primary canvas-retry-btn" @click="retryLoadModel">
            Reintentar
          </button>
        </template>
        <template v-else>
          <div class="spinner-large"></div>
          <p>Procesando geometría 3D CAD...</p>
        </template>
      </div>

      <!-- Mobile Top Bar: Quick Panel Toggles for Small Screens -->
      <div class="mobile-panel-toggles">
        <button 
          class="mobile-toggle-btn" 
          :class="{ 'active': showControlPanel }" 
          @click="showControlPanel = !showControlPanel"
          title="Opciones de Estilo y Vista"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          Estilo & Vista
        </button>
        <button 
          v-if="modelStats"
          class="mobile-toggle-btn" 
          :class="{ 'active': showDimensionsPanel }" 
          @click="showDimensionsPanel = !showDimensionsPanel"
          title="Medidas CAD"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          Medidas
        </button>
      </div>

      <!-- Left Side Floating Control Dashboard -->
      <div v-show="showControlPanel" class="control-panel glass-panel animate-fade-in">
        <div class="panel-header-mobile-close">
          <span>Configuración 3D</span>
          <button class="close-panel-btn" @click="showControlPanel = false">✕</button>
        </div>

        <div class="panel-section">
          <h3>Material Presets</h3>
          <div class="preset-selector">
            <button 
              v-for="preset in ['matte', 'chrome', 'gold']" 
              :key="preset"
              class="preset-btn"
              :class="{ 'active': materialPreset === preset }"
              @click="materialPreset = preset"
            >
              {{ preset.toUpperCase() }}
            </button>
          </div>
        </div>

        <div class="panel-section" v-if="materialPreset !== 'gold'">
          <h3>Color Swatches</h3>
          <div class="color-swatches">
            <button 
              v-for="color in colorOptions" 
              :key="color"
              class="swatch-btn"
              :style="{ backgroundColor: color }"
              :class="{ 'active': selectedColor === color }"
              @click="selectedColor = color"
            ></button>
          </div>
        </div>

        <!-- 3D Model Orientation Controls -->
        <div class="panel-section">
          <h3>Orientación del Modelo</h3>
          <div class="preset-selector orientation-selector">
            <button 
              class="preset-btn"
              :class="{ 'active': modelOrientation === 'z-up' }"
              @click="modelOrientation = 'z-up'"
              title="Orientación CAD / Impresión 3D (Z vertical erguido)"
            >
              CAD Z-UP (VERTICAL)
            </button>
            <button 
              class="preset-btn"
              :class="{ 'active': modelOrientation === 'original' }"
              @click="modelOrientation = 'original'"
              title="Orientación original sin rotación"
            >
              ORIGINAL
            </button>
          </div>
          <div class="orientation-quick-actions">
            <button class="action-sub-btn" @click="rotateYaw90" title="Girar 90° horizontalmente">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
              Girar 90°
            </button>
            <button class="action-sub-btn" :class="{ 'active': modelFlip }" @click="toggleFlip" title="Invertir orientación">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 16 4 4 4-4M7 20V4m14 4-4-4-4 4m4-4v16"/></svg>
              Invertir
            </button>
          </div>
        </div>

        <div class="panel-section">
          <h3>Parámetros de Visualización</h3>
          <div class="toggle-list">
            <label class="toggle-item">
              <span>Auto Rotar</span>
              <input type="checkbox" v-model="autoRotate" />
            </label>
            <div v-if="autoRotate" class="slider-wrapper">
              <span class="slider-label">Velocidad</span>
              <input type="range" min="0.5" max="8" step="0.5" v-model.number="autoRotateSpeed" class="slider" />
            </div>
            
            <label class="toggle-item">
              <span>Mostrar Cuadrícula</span>
              <input type="checkbox" v-model="showGrid" />
            </label>
          </div>
        </div>

        <div class="panel-section lighting-controls">
          <h3>Iluminación</h3>
          
          <div class="light-pos-section">
            <span class="light-sublabel">Posición de la Luz (Eje Lateral)</span>
            <div class="preset-selector">
              <button 
                class="preset-btn"
                :class="{ 'active': lightPosition === 'lateral' }"
                @click="setLightPosition('lateral')"
                title="Luz lateral derecha (Original)"
              >
                Lateral
              </button>
              <button 
                class="preset-btn"
                :class="{ 'active': lightPosition === 'center' }"
                @click="setLightPosition('center')"
                title="Luz centrada (sin cambiar el eje)"
              >
                Centro
              </button>
              <button 
                class="preset-btn"
                :class="{ 'active': lightPosition === 'opposite' }"
                @click="setLightPosition('opposite')"
                title="Luz en el lado contrario (sin cambiar el eje)"
              >
                Contrario
              </button>
            </div>
          </div>

          <div class="slider-wrapper light-slider-mt">
            <span class="slider-label">Luz Ambiental</span>
            <input type="range" min="0.2" max="2" step="0.1" v-model.number="ambientIntensity" class="slider" />
            <span class="value-display">{{ ambientIntensity }}x</span>
          </div>
        </div>
      </div>

      <!-- Right Side Floating Dimensions Card -->
      <div v-if="modelStats && showDimensionsPanel" class="dimensions-panel glass-panel animate-fade-in">
        <div class="panel-header-inline">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          <h3>Medidas Físicas CAD</h3>
          <button class="close-panel-btn-inline" @click="showDimensionsPanel = false">✕</button>
        </div>
        
        <div class="stats-grid">
          <div class="stat-row">
            <span class="stat-lbl">X-Longitud:</span>
            <span class="stat-val">{{ modelStats.dimensions.x }} mm</span>
          </div>
          <div class="stat-row">
            <span class="stat-lbl">Y-Ancho:</span>
            <span class="stat-val">{{ modelStats.dimensions.y }} mm</span>
          </div>
          <div class="stat-row">
            <span class="stat-lbl">Z-Altura:</span>
            <span class="stat-val">{{ modelStats.dimensions.z }} mm</span>
          </div>
          <div class="divider"></div>
          <div class="stat-row highlight">
            <span class="stat-lbl">Volumen Est.:</span>
            <span class="stat-val">{{ modelStats.volume.toFixed(2) }} cm³</span>
          </div>
        </div>
        <p class="stats-note">*Calculado según la integral de volumen con signo del modelo STL.</p>
        
        <!-- Download STL button in dimensions panel -->
        <button 
          v-if="currentModel"
          class="download-stl-panel-btn" 
          :class="{ 'loading': isDownloadingModel }"
          @click="handleDownloadModel"
          title="Descargar archivo STL"
        >
          <svg v-if="!isDownloadingModel" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span v-else class="btn-spinner"></span>
          <span>Descargar STL</span>
        </button>
      </div>

      <!-- Active Mode Floating Badge -->
      <div class="touch-mode-badge animate-fade-in">
        <span class="mode-dot" :class="touchMode"></span>
        <span class="mode-text">
          {{ touchMode === 'pan' ? 'Modo Desplazamiento (1 dedo arrastra)' : 'Modo Rotación (1 dedo gira)' }}
        </span>
      </div>

      <!-- Temporary Light Position Badge Feedback -->
      <div v-if="lightFeedbackNotice" class="light-feedback-badge animate-fade-in">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M2 12h2"/><path d="M20 12h2"/></svg>
        <span>{{ lightFeedbackNotice }}</span>
      </div>

      <!-- Directional Nudge Pad (Pop-up for fine tactile displacement) -->
      <div v-if="showNudgePad" class="directional-nudge-pad glass-panel animate-slide-up">
        <div class="nudge-title">Desplazamiento fino</div>
        <div class="nudge-row">
          <button class="nudge-btn" @click="handlePanStep(0, 1)" title="Mover arriba">▲</button>
        </div>
        <div class="nudge-row middle">
          <button class="nudge-btn" @click="handlePanStep(-1, 0)" title="Mover izquierda">◀</button>
          <button class="nudge-btn center-dot" @click="handleResetView" title="Recentrar">●</button>
          <button class="nudge-btn" @click="handlePanStep(1, 0)" title="Mover derecha">▶</button>
        </div>
        <div class="nudge-row">
          <button class="nudge-btn" @click="handlePanStep(0, -1)" title="Mover abajo">▼</button>
        </div>
      </div>

      <!-- FLOATING MOBILE & TOUCH CONTROLS TOOLBAR -->
      <div class="mobile-touch-toolbar glass-panel animate-fade-in">
        <!-- 1-Finger Touch Mode Switcher -->
        <div class="mode-toggle-pill" role="group" aria-label="Modo táctil">
          <button 
            class="mode-toggle-btn" 
            :class="{ 'active': touchMode === 'rotate' }"
            @click="setTouchMode('rotate')"
            title="Modo Rotación: 1 dedo gira el modelo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            <span>Rotar</span>
          </button>
          <button 
            class="mode-toggle-btn" 
            :class="{ 'active': touchMode === 'pan' }"
            @click="setTouchMode('pan')"
            title="Modo Desplazamiento: 1 dedo mueve el modelo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>
            <span>Desplazar</span>
          </button>
        </div>

        <div class="touch-btn-divider"></div>

        <!-- Touch Quick Action Buttons (Zoom & Camera Tools) -->
        <div class="touch-actions-cluster">
          <!-- Zoom In (+) -->
          <button class="touch-action-btn" @click="handleZoomIn" title="Acercar (Zoom In)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>

          <!-- Zoom Out (-) -->
          <button class="touch-action-btn" @click="handleZoomOut" title="Alejar (Zoom Out)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>

          <!-- Recenter View Button -->
          <button class="touch-action-btn" @click="handleResetView" title="Recentrar y enfocar vista">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M3 12h3m12 0h3M12 3v3m0 12v3"/></svg>
          </button>

          <!-- Toggle Nudge Pad -->
          <button 
            class="touch-action-btn" 
            :class="{ 'active': showNudgePad }" 
            @click="showNudgePad = !showNudgePad" 
            title="Pad direccional de desplazamiento"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>
          </button>

          <!-- Light Position Toggle Button -->
          <button 
            class="touch-action-btn" 
            :class="{ 'active': lightPosition !== 'lateral' }"
            @click="cycleLightPosition" 
            :title="`Posición de luz: ${lightPositionLabel} (clic: Lateral → Centro → Contrario)`"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2"/>
              <path d="M12 20v2"/>
              <path d="m4.93 4.93 1.41 1.41"/>
              <path d="m17.66 17.66 1.41 1.41"/>
              <path d="M2 12h2"/>
              <path d="M20 12h2"/>
              <path d="m6.34 17.66-1.41 1.41"/>
              <path d="m19.07 4.93-1.41 1.41"/>
            </svg>
          </button>

          <!-- Download Model Button -->
          <button 
            v-if="currentModel"
            class="touch-action-btn download-action-btn" 
            :class="{ 'loading': isDownloadingModel }"
            @click="handleDownloadModel" 
            :title="`Descargar modelo STL (${currentModel.name})`"
          >
            <svg v-if="!isDownloadingModel" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span v-else class="btn-spinner"></span>
          </button>

          <!-- Fullscreen Toggle -->
          <button class="touch-action-btn" @click="toggleFullscreen" title="Pantalla completa">
            <svg v-if="!isFullscreen" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
          </button>
        </div>
      </div>

      <!-- Controls Overlay HUD Hint (Desktop) -->
      <div class="hud-hint">
        <p>1 dedo: {{ touchMode === 'pan' ? 'Desplazar' : 'Rotar' }} · 2 dedos: Zoom y Paneo · Clic der: Paneo</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, unref, onMounted, onUnmounted } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { OrbitControls } from '@tresjs/cientos'
import * as THREE from 'three'
import STLModel from './STLModel.vue'
import { downloadResource } from '../utils/download'

const props = defineProps({
  modelList: {
    type: Array,
    required: true
  }
})

const viewerContainerRef = ref(null)
const canvasWrapperRef = ref(null)
const cameraRef = ref(null)
const orbitControlsRef = ref(null)
const mainLightRef = ref(null)
const fillLightRef = ref(null)

const activeModelIndex = ref(0)
const isModelLoading = ref(true)
const modelStats = ref(null)
const modelLoadError = ref(null)
const reloadTrigger = ref(0)
const isDownloadingModel = ref(false)

const handleDownloadModel = async () => {
  if (!currentModel.value || !currentModel.value.url) return
  isDownloadingModel.value = true
  try {
    await downloadResource(currentModel.value.url, currentModel.value.name || 'modelo.stl')
  } finally {
    isDownloadingModel.value = false
  }
}

const downloadModelItem = async (model) => {
  if (!model || !model.url) return
  await downloadResource(model.url, model.name || 'modelo.stl')
}

// Panel visibility (responsive)
const isSmallScreen = typeof window !== 'undefined' ? window.innerWidth < 768 : false
const showControlPanel = ref(!isSmallScreen)
const showDimensionsPanel = ref(!isSmallScreen)
const showNudgePad = ref(false)
const isFullscreen = ref(false)

// Orientation and model alignment parameters
const modelOrientation = ref('z-up') // 'z-up' (CAD erguido) | 'original'
const modelYaw = ref(0)
const modelFlip = ref(false)

const rotateYaw90 = () => {
  modelYaw.value = (modelYaw.value + Math.PI / 2) % (Math.PI * 2)
}

const toggleFlip = () => {
  modelFlip.value = !modelFlip.value
}

// Render parameters
const autoRotate = ref(false)
const autoRotateSpeed = ref(2.0)
const showGrid = ref(true)
const ambientIntensity = ref(0.8)

// Lighting position parameters
// Options: 'lateral' (Right side, X=+8, original default), 'center' (Centered on X=0), 'opposite' (Left side, X=-8)
const lightPosition = ref('lateral')
const lightFeedbackNotice = ref('')
let lightFeedbackTimeout = null

const showLightNotice = (text) => {
  lightFeedbackNotice.value = text
  if (lightFeedbackTimeout) clearTimeout(lightFeedbackTimeout)
  lightFeedbackTimeout = setTimeout(() => {
    lightFeedbackNotice.value = ''
  }, 1800)
}

const lightX = computed(() => {
  if (lightPosition.value === 'center') return 0
  if (lightPosition.value === 'opposite') return -8
  return 8 // 'lateral'
})

const mainLightPosition = computed(() => [lightX.value, 12, 8])
const fillLightPosition = computed(() => [-lightX.value, -8, -8])

const lightPositionLabel = computed(() => {
  if (lightPosition.value === 'center') return 'Centro'
  if (lightPosition.value === 'opposite') return 'Lado Contrario'
  return 'Lateral'
})

const setLightPosition = (pos) => {
  lightPosition.value = pos
  showLightNotice(`Luz: ${lightPositionLabel.value}`)
}

const cycleLightPosition = () => {
  if (lightPosition.value === 'lateral') {
    lightPosition.value = 'center'
  } else if (lightPosition.value === 'center') {
    lightPosition.value = 'opposite'
  } else {
    lightPosition.value = 'lateral'
  }
  showLightNotice(`Luz: ${lightPositionLabel.value}`)
}

// Sync directly with Three.js DirectionalLight instances if needed
watch(mainLightPosition, (pos) => {
  const light = unref(mainLightRef)
  if (light && light.position && typeof light.position.set === 'function') {
    light.position.set(pos[0], pos[1], pos[2])
  }
})

watch(fillLightPosition, (pos) => {
  const light = unref(fillLightRef)
  if (light && light.position && typeof light.position.set === 'function') {
    light.position.set(pos[0], pos[1], pos[2])
  }
})
const materialPreset = ref('matte')
const selectedColor = ref('#8b5cf6')

// Touch interaction mode: 'rotate' or 'pan'
const touchMode = ref('rotate')

const setTouchMode = (mode) => {
  touchMode.value = mode
  // Directly ensure orbit controls touches update
  const controls = getOrbitControls()
  if (controls && controls.touches) {
    if (mode === 'pan') {
      controls.touches.ONE = THREE.TOUCH.PAN
      controls.touches.TWO = THREE.TOUCH.DOLLY_PAN
    } else {
      controls.touches.ONE = THREE.TOUCH.ROTATE
      controls.touches.TWO = THREE.TOUCH.DOLLY_PAN
    }
  }
}

// Pauses autoRotate automatically while user is in Pan mode for better control
const effectiveAutoRotate = computed(() => {
  if (touchMode.value === 'pan') return false
  return autoRotate.value
})

// Dynamic touch configuration for OrbitControls
const touchConfig = computed(() => {
  if (touchMode.value === 'pan') {
    return {
      ONE: THREE.TOUCH.PAN,
      TWO: THREE.TOUCH.DOLLY_PAN
    }
  }
  return {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN
  }
})

const colorOptions = [
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#ef4444', // Red
  '#f59e0b', // Orange
  '#64748b'  /* Slate */
]

const currentModel = computed(() => {
  if (props.modelList.length === 0) return null
  return props.modelList[activeModelIndex.value]
})

// Triggers loader overlay on model change
watch(activeModelIndex, () => {
  isModelLoading.value = true
  modelStats.value = null
  modelLoadError.value = null
  modelYaw.value = 0
  modelFlip.value = false
})

const handleModelLoaded = (stats) => {
  modelStats.value = stats
  modelLoadError.value = null
  isModelLoading.value = false
}

const handleModelError = (err) => {
  console.error('Error cargando modelo 3D:', err)
  modelStats.value = null
  isModelLoading.value = false
  modelLoadError.value = 'No se pudo cargar el archivo 3D seleccionado.'
}

const retryLoadModel = () => {
  modelLoadError.value = null
  isModelLoading.value = true
  reloadTrigger.value++
}

// Helper to safely extract OrbitControls instance from ref
const getOrbitControls = () => {
  if (!orbitControlsRef.value) return null
  const inst = orbitControlsRef.value.instance
  return (inst && inst.value) ? inst.value : (inst || orbitControlsRef.value)
}

// Helper to safely extract Camera
const getCamera = () => {
  const controls = getOrbitControls()
  if (controls && controls.object) return controls.object
  if (cameraRef.value) {
    return cameraRef.value.value || cameraRef.value
  }
  return null
}

// Programmatic Zoom In
const handleZoomIn = () => {
  const controls = getOrbitControls()
  const camera = getCamera()
  if (!camera) return
  
  const target = (controls && controls.target) ? controls.target : new THREE.Vector3(0, 0, 0)
  const offset = new THREE.Vector3().subVectors(camera.position, target)
  const dist = offset.length()
  
  if (dist > 0.5) {
    offset.multiplyScalar(0.8) // 20% zoom in
    camera.position.copy(target).add(offset)
    if (controls && typeof controls.update === 'function') {
      controls.update()
    }
  }
}

// Programmatic Zoom Out
const handleZoomOut = () => {
  const controls = getOrbitControls()
  const camera = getCamera()
  if (!camera) return
  
  const target = (controls && controls.target) ? controls.target : new THREE.Vector3(0, 0, 0)
  const offset = new THREE.Vector3().subVectors(camera.position, target)
  const dist = offset.length()
  
  if (dist < 40) {
    offset.multiplyScalar(1.25) // 25% zoom out
    camera.position.copy(target).add(offset)
    if (controls && typeof controls.update === 'function') {
      controls.update()
    }
  }
}

// Tactile Directional Pan Step (Desplazamiento fino)
const handlePanStep = (dirX, dirY) => {
  const controls = getOrbitControls()
  const camera = getCamera()
  if (!camera) return
  
  const target = (controls && controls.target) ? controls.target : new THREE.Vector3(0, 0, 0)
  const dist = camera.position.distanceTo(target)
  const step = Math.max(0.12, dist * 0.08)
  
  // Extract camera basis in world space
  const right = new THREE.Vector3()
  const up = new THREE.Vector3()
  camera.matrix.extractBasis(right, up, new THREE.Vector3())
  
  const offset = new THREE.Vector3()
    .addScaledVector(right, -dirX * step)
    .addScaledVector(up, -dirY * step)
    
  camera.position.add(offset)
  if (controls && controls.target) {
    controls.target.add(offset)
  }
  if (controls && typeof controls.update === 'function') {
    controls.update()
  }
}

// Reset / Center View
const handleResetView = () => {
  const controls = getOrbitControls()
  const camera = getCamera()
  if (!camera) return
  
  if (controls && controls.target) {
    controls.target.set(0, 0, 0)
  }
  camera.position.set(4, 4, 4)
  camera.lookAt(0, 0, 0)
  if (controls && typeof controls.update === 'function') {
    controls.update()
  }
}

// Fullscreen toggle
const toggleFullscreen = () => {
  const container = viewerContainerRef.value
  if (!container) return
  
  if (!document.fullscreenElement) {
    if (container.requestFullscreen) {
      container.requestFullscreen().catch(() => {
        isFullscreen.value = !isFullscreen.value
      })
    } else {
      isFullscreen.value = !isFullscreen.value
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {
        isFullscreen.value = false
      })
    } else {
      isFullscreen.value = false
    }
  }
}

const onFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

onMounted(() => {
  document.addEventListener('fullscreenchange', onFullscreenChange)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  if (lightFeedbackTimeout) clearTimeout(lightFeedbackTimeout)
})
</script>

<style scoped>
.viewer-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  background: #0b0f19;
  border-radius: var(--border-radius-md);
  overflow: hidden;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
  border: 1px solid var(--glass-border);
  transition: all var(--transition-normal);
}

.viewer-container.is-fullscreen {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh !important;
  z-index: 9999;
  border-radius: 0;
  border: none;
}

.model-tabs {
  display: flex;
  background: rgba(15, 22, 36, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding: 8px 12px;
  gap: 8px;
  overflow-x: auto;
  z-index: 100;
}

.model-tab-item {
  display: inline-flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  overflow: hidden;
}

.model-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  padding: 6px 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.model-tab-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.05);
}

.model-tab-btn.active {
  color: #ffffff;
  background: var(--accent-secondary);
}

.model-tab-download-btn {
  background: transparent;
  border: none;
  border-left: 1px solid rgba(255, 255, 255, 0.06);
  color: var(--text-muted);
  padding: 6px 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.model-tab-download-btn:hover {
  color: #ffffff;
  background: var(--accent-primary);
}

.canvas-wrapper {
  flex: 1;
  width: 100%;
  height: 100%;
  position: relative;
  touch-action: none !important;
  user-select: none;
  -webkit-user-select: none;
  overflow: hidden;
}

.canvas-wrapper :deep(canvas) {
  touch-action: none !important;
  outline: none;
}

/* Canvas Loader */
.canvas-loader-overlay {
  position: absolute;
  inset: 0;
  background: rgba(11, 15, 25, 0.85);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  z-index: 10;
  color: var(--text-secondary);
  font-size: 14px;
}

.spinner-large {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(255,255,255,0.05);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-badge-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 50%;
  margin-bottom: -4px;
}

.error-load-title {
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
}

.error-load-text {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
  text-align: center;
  max-width: 280px;
}

.canvas-retry-btn {
  margin-top: 4px;
  padding: 8px 18px;
  font-size: 13px;
}

/* Mobile Quick Toggles (Top Corners) */
.mobile-panel-toggles {
  display: none;
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 22;
  gap: 8px;
}

.mobile-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(15, 22, 36, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 20px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
  transition: all var(--transition-fast);
}

.mobile-toggle-btn.active {
  background: var(--accent-primary);
  color: #ffffff;
  border-color: var(--accent-primary);
  box-shadow: 0 2px 10px var(--accent-primary-glow);
}

/* Floating Controls Left */
.control-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 320px;
  padding: 18px 20px;
  z-index: 20;
  border-radius: var(--border-radius-md);
  box-shadow: var(--glass-shadow);
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: calc(100% - 40px);
  overflow-y: auto;
}

.panel-header-mobile-close {
  display: none;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 8px;
}

.close-panel-btn, .close-panel-btn-inline {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-muted);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 11px;
  transition: all var(--transition-fast);
  margin-left: auto;
}

.close-panel-btn:hover, .close-panel-btn-inline:hover {
  color: #ffffff;
  background: rgba(239, 68, 68, 0.25);
  border-color: rgba(239, 68, 68, 0.4);
}

.panel-section h3 {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  margin-bottom: 8px;
  font-weight: 700;
}

.preset-selector {
  display: flex;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  padding: 2px;
  gap: 2px;
}

.preset-btn {
  flex: 1;
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  padding: 6px 3px;
  border-radius: 4px;
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: center;
  white-space: nowrap;
}

.preset-btn:hover {
  color: var(--text-primary);
}

.preset-btn.active {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  border: 1px solid rgba(255,255,255,0.05);
}

.orientation-selector {
  margin-bottom: 8px;
}

.orientation-quick-actions {
  display: flex;
  gap: 6px;
}

.action-sub-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 500;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-sub-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
}

.action-sub-btn.active {
  background: rgba(139, 92, 246, 0.2);
  border-color: var(--accent-primary);
  color: #ffffff;
}

.color-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.swatch-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform var(--transition-fast), border-color var(--transition-fast);
}

.swatch-btn:hover {
  transform: scale(1.15);
}

.swatch-btn.active {
  border-color: #ffffff;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
}

.toggle-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toggle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
}

.toggle-item input {
  cursor: pointer;
  accent-color: var(--accent-primary);
}

.slider-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.slider-label {
  font-size: 10px;
  color: var(--text-muted);
}

.slider {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: rgba(255,255,255,0.1);
  outline: none;
  accent-color: var(--accent-primary);
}

.value-display {
  font-size: 11px;
  color: var(--text-muted);
  min-width: 24px;
  text-align: right;
}

/* Floating Dimensions Right */
.dimensions-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 260px;
  padding: 16px;
  z-index: 20;
  border-radius: var(--border-radius-md);
  box-shadow: var(--glass-shadow);
}

.panel-header-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--accent-secondary);
  margin-bottom: 12px;
}

.panel-header-inline h3 {
  font-size: 13px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
  margin-bottom: 0;
}

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.stat-lbl {
  color: var(--text-secondary);
}

.stat-val {
  font-weight: 500;
  color: var(--text-primary);
}

.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.05);
  margin: 4px 0;
}

.stat-row.highlight {
  font-size: 13px;
  font-weight: 600;
}

.stat-row.highlight .stat-lbl {
  color: var(--text-primary);
}

.stat-row.highlight .stat-val {
  color: var(--accent-secondary);
}

.stats-note {
  font-size: 9px;
  color: var(--text-muted);
  margin-top: 10px;
  line-height: 1.3;
}

.download-stl-panel-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  margin-top: 14px;
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.35);
  color: #ffffff;
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: 0 2px 10px rgba(139, 92, 246, 0.15);
}

.download-stl-panel-btn:hover {
  background: var(--accent-primary);
  box-shadow: 0 4px 14px var(--accent-primary-glow);
  transform: translateY(-1px);
}

.download-stl-panel-btn.loading {
  opacity: 0.75;
  pointer-events: none;
}

/* Active Mode Floating Badge */
.touch-mode-badge {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(11, 15, 25, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 11px;
  color: var(--text-secondary);
  pointer-events: none;
  z-index: 18;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.mode-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent-primary);
  box-shadow: 0 0 8px var(--accent-primary);
  transition: all var(--transition-fast);
}

.mode-dot.pan {
  background: var(--accent-secondary);
  box-shadow: 0 0 8px var(--accent-secondary);
}

/* Light Feedback Floating Badge */
.light-feedback-badge {
  position: absolute;
  top: 48px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 7px;
  background: rgba(11, 15, 25, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 11px;
  color: #ffffff;
  pointer-events: none;
  z-index: 18;
  white-space: nowrap;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
}

.light-feedback-badge svg {
  color: var(--accent-secondary);
}

.light-pos-section {
  margin-bottom: 8px;
}

.light-sublabel {
  display: block;
  font-size: 10px;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.light-slider-mt {
  margin-top: 10px;
}

/* Directional Nudge Pad */
.directional-nudge-pad {
  position: absolute;
  bottom: 82px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(15, 22, 36, 0.92);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  z-index: 26;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
}

.nudge-title {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  font-weight: 700;
  margin-bottom: 4px;
}

.nudge-row {
  display: flex;
  gap: 4px;
}

.nudge-btn {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--transition-fast);
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.nudge-btn:hover, .nudge-btn:active {
  background: var(--accent-primary);
  color: #ffffff;
  transform: scale(1.05);
}

.nudge-btn.center-dot {
  color: var(--accent-secondary);
  font-size: 11px;
}

/* Floating Mobile & Touch Controls Toolbar */
.mobile-touch-toolbar {
  position: absolute;
  bottom: 22px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 25;
  background: rgba(15, 22, 36, 0.9);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 6px 10px;
  border-radius: 36px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.55), 0 0 20px rgba(139, 92, 246, 0.15);
  max-width: calc(100% - 24px);
  overflow-x: auto;
}

.mode-toggle-pill {
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 2px;
  gap: 2px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.mode-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 12px;
  border-radius: 18px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.mode-toggle-btn.active {
  background: var(--accent-primary);
  color: #ffffff;
  box-shadow: 0 2px 10px var(--accent-primary-glow);
}

.touch-btn-divider {
  width: 1px;
  height: 22px;
  background: rgba(255, 255, 255, 0.12);
}

.touch-actions-cluster {
  display: flex;
  align-items: center;
  gap: 6px;
}

.touch-action-btn {
  width: 36px;
  height: 36px;
  min-width: 36px;
  min-height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.touch-action-btn:hover, .touch-action-btn:active {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.12);
  transform: scale(1.08);
}

.touch-action-btn.active {
  color: var(--accent-secondary);
  border-color: var(--accent-secondary);
  background: rgba(6, 182, 212, 0.18);
  box-shadow: 0 0 10px rgba(6, 182, 212, 0.3);
}

.touch-action-btn.download-action-btn {
  color: var(--accent-secondary);
}

.touch-action-btn.download-action-btn:hover {
  background: rgba(6, 182, 212, 0.2);
  border-color: var(--accent-secondary);
  color: #ffffff;
}

.touch-action-btn.download-action-btn.loading {
  pointer-events: none;
  opacity: 0.8;
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* HUD Hint Bottom (Desktop) */
.hud-hint {
  position: absolute;
  bottom: 84px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(13, 17, 28, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(6px);
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 11px;
  color: var(--text-muted);
  z-index: 10;
  pointer-events: none;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  white-space: nowrap;
}

/* Responsive adjustments */
@media (max-width: 900px) {
  .viewer-container {
    height: 520px;
  }
  .hud-hint {
    display: none;
  }
  .mobile-panel-toggles {
    display: flex;
  }
  .control-panel {
    top: 56px;
    bottom: auto;
    left: 12px;
    width: 320px;
    max-width: calc(100% - 24px);
    max-height: calc(100% - 130px);
    overflow-y: auto;
    z-index: 30;
  }
  .dimensions-panel {
    top: 56px;
    bottom: auto;
    right: 12px;
    width: 280px;
    max-width: calc(100% - 24px);
    max-height: calc(100% - 130px);
    overflow-y: auto;
    z-index: 30;
  }
  .panel-header-mobile-close {
    display: flex;
  }
}

@media (max-width: 600px) {
  .viewer-container {
    height: 480px;
  }
  .control-panel, .dimensions-panel {
    top: 52px;
    left: 8px;
    right: 8px;
    width: auto;
    max-width: none;
    z-index: 35;
  }
  .mobile-touch-toolbar {
    bottom: 14px;
    padding: 5px 8px;
    gap: 6px;
  }
  .mode-toggle-btn {
    padding: 6px 10px;
    font-size: 11px;
  }
  .touch-action-btn {
    width: 34px;
    height: 34px;
    min-width: 34px;
    min-height: 34px;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
