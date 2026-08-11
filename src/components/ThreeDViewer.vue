<template>
  <div class="viewer-container">
    <!-- Multiple model selector tab (if project has > 1 STL model) -->
    <div v-if="modelList.length > 1" class="model-tabs">
      <button 
        v-for="(model, idx) in modelList" 
        :key="model.id || idx" 
        class="model-tab-btn" 
        :class="{ 'active': activeModelIndex === idx }"
        @click="activeModelIndex = idx"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        {{ model.name }}
      </button>
    </div>

    <!-- Active 3D Canvas Space -->
    <div class="canvas-wrapper">
      <TresCanvas 
        v-if="currentModel"
        clear-color="#0b0f19" 
        shadows 
        alpha
      >
        <TresPerspectiveCamera :position="[4, 4, 4]" :look-at="[0, 0, 0]" />
        
        <!-- Camera Controls -->
        <OrbitControls 
          :enable-damping="true"
          :damping-factor="0.05"
          :auto-rotate="autoRotate"
          :auto-rotate-speed="autoRotateSpeed"
        />
        
        <!-- Lights -->
        <TresAmbientLight :intensity="ambientIntensity" />
        <TresDirectionalLight :position="[8, 12, 8]" :intensity="1.5" cast-shadow />
        <TresDirectionalLight :position="[-8, -8, -8]" :intensity="0.6" />
        <TresPointLight :position="[0, 5, 0]" :intensity="0.5" />
        
        <!-- Grid Helper -->
        <TresGridHelper v-if="showGrid" :args="[12, 12, '#4f46e5', '#1f2937']" :position="[0, -1.5, 0]" />

        <!-- 3D Model with loader boundary -->
        <Suspense>
          <template #default>
            <STLModel 
              :url="currentModel.url"
              :material-style="materialPreset"
              :color="selectedColor"
              @model-loaded="handleModelLoaded"
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

      <!-- Floating Absolute Loading Overlay -->
      <div v-if="isModelLoading" class="canvas-loader-overlay">
        <div class="spinner-large"></div>
        <p>Parsing 3D CAD Geometry...</p>
      </div>

      <!-- Left Side Floating Control Dashboard -->
      <div class="control-panel glass-panel">
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

        <div class="panel-section">
          <h3>Display Parameters</h3>
          <div class="toggle-list">
            <label class="toggle-item">
              <span>Auto Rotate</span>
              <input type="checkbox" v-model="autoRotate" />
            </label>
            <div v-if="autoRotate" class="slider-wrapper">
              <span class="slider-label">Speed</span>
              <input type="range" min="0.5" max="8" step="0.5" v-model.number="autoRotateSpeed" class="slider" />
            </div>
            
            <label class="toggle-item">
              <span>Show Ground Grid</span>
              <input type="checkbox" v-model="showGrid" />
            </label>
          </div>
        </div>

        <div class="panel-section lighting-controls">
          <h3>Ambient Light Intensity</h3>
          <div class="slider-wrapper">
            <input type="range" min="0.2" max="2" step="0.1" v-model.number="ambientIntensity" class="slider" />
            <span class="value-display">{{ ambientIntensity }}x</span>
          </div>
        </div>
      </div>

      <!-- Right Side Floating Dimensions Card -->
      <div v-if="modelStats" class="dimensions-panel glass-panel animate-fade-in">
        <div class="panel-header-inline">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          <h3>CAD Physical Stats</h3>
        </div>
        
        <div class="stats-grid">
          <div class="stat-row">
            <span class="stat-lbl">X-Length:</span>
            <span class="stat-val">{{ modelStats.dimensions.x }} mm</span>
          </div>
          <div class="stat-row">
            <span class="stat-lbl">Y-Width:</span>
            <span class="stat-val">{{ modelStats.dimensions.y }} mm</span>
          </div>
          <div class="stat-row">
            <span class="stat-lbl">Z-Height:</span>
            <span class="stat-val">{{ modelStats.dimensions.z }} mm</span>
          </div>
          <div class="divider"></div>
          <div class="stat-row highlight">
            <span class="stat-lbl">Est. Volume:</span>
            <span class="stat-val">{{ modelStats.volume.toFixed(2) }} cm³</span>
          </div>
        </div>
        <p class="stats-note">*Volume computed by triangle mesh signed volume integral.</p>
      </div>

      <!-- Controls Overlay HUD Hint -->
      <div class="hud-hint">
        <p>Drag to rotate. Right-drag to pan. Scroll to zoom.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { OrbitControls } from '@tresjs/cientos'
import STLModel from './STLModel.vue'

const props = defineProps({
  modelList: {
    type: Array,
    required: true
  }
})

const activeModelIndex = ref(0)
const isModelLoading = ref(true)
const modelStats = ref(null)

// Render parameters
const autoRotate = ref(true)
const autoRotateSpeed = ref(2.0)
const showGrid = ref(true)
const ambientIntensity = ref(0.8)
const materialPreset = ref('matte')
const selectedColor = ref('#8b5cf6')

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
})

const handleModelLoaded = (stats) => {
  modelStats.value = stats
  isModelLoading.value = false
}
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

.model-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 6px 12px;
  border-radius: 4px;
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
  border-color: var(--accent-secondary);
}

.canvas-wrapper {
  flex: 1;
  width: 100%;
  height: 100%;
  position: relative;
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

/* Floating Controls Left */
.control-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 240px;
  padding: 20px;
  z-index: 20;
  border-radius: var(--border-radius-md);
  box-shadow: var(--glass-shadow);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.panel-section h3 {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  margin-bottom: 10px;
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
  font-size: 10px;
  font-weight: 700;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.preset-btn:hover {
  color: var(--text-primary);
}

.preset-btn.active {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  border: 1px solid rgba(255,255,255,0.05);
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
  width: 240px;
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

/* HUD Hint Bottom */
.hud-hint {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(13, 17, 28, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(6px);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 11px;
  color: var(--text-muted);
  z-index: 10;
  pointer-events: none;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

/* Responsive adjustments */
@media (max-width: 900px) {
  .viewer-container {
    height: 500px;
  }
  .control-panel {
    top: auto;
    bottom: 20px;
    left: 20px;
    width: calc(50% - 30px);
  }
  .dimensions-panel {
    top: auto;
    bottom: 20px;
    right: 20px;
    width: calc(50% - 30px);
  }
  .hud-hint {
    display: none;
  }
}

@media (max-width: 600px) {
  .control-panel, .dimensions-panel {
    position: static;
    width: 100%;
    border-radius: 0;
    box-shadow: none;
    background: rgba(15, 22, 36, 0.95);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  .canvas-wrapper {
    height: 380px;
    display: flex;
    flex-direction: column;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
