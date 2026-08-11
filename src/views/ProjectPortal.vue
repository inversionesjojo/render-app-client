<template>
  <div class="portal-layout">
    <!-- Glowing background elements -->
    <div class="glow-orb primary-orb"></div>
    <div class="glow-orb secondary-orb"></div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner-large"></div>
      <p>Loading project details...</p>
    </div>

    <!-- Error State (Project Not Found) -->
    <div v-else-if="error" class="error-container glass-panel">
      <div class="error-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <h2>Project Not Found</h2>
      <p>The project slug <strong>{{ slug }}</strong> could not be located in our system.</p>
      <button class="btn btn-primary" @click="$router.push('/')">
        Go Back Home
      </button>
    </div>

    <!-- Gated/Unlocked Area -->
    <div v-else class="content-wrapper">
      <!-- 1. Gated PIN Input -->
      <PinPrompt 
        v-if="!unlocked" 
        :project-title="project.title" 
        :expected-pin="project.pin"
        @unlock-success="handleUnlock"
      />

      <!-- 2. Unlocked Project Space -->
      <div v-else class="dashboard-area animate-fade-in">
        <!-- Dashboard Top Header Bar -->
        <header class="dashboard-header glass-panel">
          <div class="project-info">
            <span class="badge">SECURE PORTAL</span>
            <h1>{{ project.title }}</h1>
            <p class="meta-info">Opened on {{ formatDate(project.created_at) }}</p>
          </div>
          
          <div class="navigation-controls">
            <!-- Tabs -->
            <div class="tabs-nav">
              <button 
                class="tab-btn" 
                :class="{ 'active': activeTab === 'media' }"
                @click="activeTab = 'media'"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
                Media Files ({{ imageVideoCount }})
              </button>
              
              <button 
                class="tab-btn" 
                :class="{ 'active': activeTab === '3d' }"
                @click="activeTab = '3d'"
                :disabled="!has3DModel"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                3D CAD Models ({{ stlCount }})
              </button>
            </div>
            
            <button class="btn btn-secondary lock-project-btn" @click="lockProject" title="Lock Portal">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Lock
            </button>
          </div>
        </header>

        <!-- Tab Panels -->
        <main class="dashboard-main">
          <!-- Media Tab -->
          <div v-if="activeTab === 'media'" class="tab-panel animate-slide-up">
            <ImageVideoGallery :media-list="imagesAndVideos" />
          </div>

          <!-- 3D Viewer Tab -->
          <div v-if="activeTab === '3d'" class="tab-panel height-full animate-slide-up">
            <ThreeDViewer :model-list="stlModels" />
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../supabase'
import PinPrompt from '../components/PinPrompt.vue'
import ThreeDViewer from '../components/ThreeDViewer.vue'
import ImageVideoGallery from '../components/ImageVideoGallery.vue'
import confetti from 'canvas-confetti'

const props = defineProps({
  slug: {
    type: String,
    required: true
  }
})

const project = ref(null)
const loading = ref(true)
const error = ref(false)
const unlocked = ref(false)
const activeTab = ref('media')

// Fetch project from Supabase
const fetchProject = async () => {
  try {
    loading.value = true
    error.value = false
    
    const { data, error: err } = await supabase
      .from('projects')
      .select('*')
      .eq('slug', props.slug)
      .single()

    if (err || !data) {
      error.value = true
    } else {
      project.value = data
      
      // Check sessionStorage to see if project was already unlocked in this tab session
      const isUnlocked = sessionStorage.getItem(`unlocked_${props.slug}`)
      if (isUnlocked === 'true') {
        unlocked.value = true
      }
    }
  } catch (e) {
    error.value = true
  } finally {
    loading.value = false
  }
}

// Media calculations
const mediaArray = computed(() => {
  if (!project.value || !project.value.media) return []
  return Array.isArray(project.value.media) ? project.value.media : []
})

const imagesAndVideos = computed(() => {
  return mediaArray.value.filter(m => m.type === 'image' || m.type === 'video')
})

const stlModels = computed(() => {
  return mediaArray.value.filter(m => m.type === '3d')
})

const imageVideoCount = computed(() => imagesAndVideos.value.length)
const stlCount = computed(() => stlModels.value.length)
const has3DModel = computed(() => stlModels.value.length > 0)

// Unlock handler
const handleUnlock = () => {
  unlocked.value = true
  sessionStorage.setItem(`unlocked_${props.slug}`, 'true')
  
  // Direct default tab to 3D if they only have 3D and no regular media
  if (imagesAndVideos.value.length === 0 && has3DModel.value) {
    activeTab.value = '3d'
  }
  
  // Premium success confetti animation
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.65 },
    colors: ['#8b5cf6', '#06b6d4', '#10b981']
  })
}

// Lock project
const lockProject = () => {
  unlocked.value = false
  sessionStorage.removeItem(`unlocked_${props.slug}`)
  activeTab.value = 'media'
}

// Formatting helpers
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}


onMounted(() => {
  fetchProject()
})
</script>

<style scoped>
.portal-layout {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

/* Background Glowing Orbs */
.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(140px);
  opacity: 0.12;
  z-index: 0;
  pointer-events: none;
}

.primary-orb {
  top: 10%;
  right: 15%;
  width: 450px;
  height: 450px;
  background-color: var(--accent-primary);
}

.secondary-orb {
  bottom: 10%;
  left: 15%;
  width: 400px;
  height: 400px;
  background-color: var(--accent-secondary);
}

/* Loading state */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 16px;
  color: var(--text-secondary);
}

.spinner-large {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.05);
  border-top-color: var(--accent-secondary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Error State */
.error-container {
  max-width: 480px;
  margin: 120px auto;
  padding: 40px;
  text-align: center;
  border-radius: var(--border-radius-lg);
  position: relative;
  z-index: 10;
}

.error-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 50%;
  color: var(--color-danger);
  margin-bottom: 20px;
}

.error-container h2 {
  font-size: 24px;
  margin-bottom: 12px;
}

.error-container p {
  font-size: 14px;
  margin-bottom: 24px;
}

/* Dashboard Area */
.content-wrapper {
  position: relative;
  z-index: 10;
  width: 100%;
}

.dashboard-area {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px;
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  padding: 20px 28px;
  border-radius: var(--border-radius-md);
  margin-bottom: 24px;
  gap: 16px;
}

.project-info h1 {
  font-size: 24px;
  margin: 4px 0;
  background: linear-gradient(to right, var(--text-primary), var(--text-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.badge {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  background: rgba(139, 92, 246, 0.15);
  color: var(--accent-primary);
  border: 1px solid rgba(139, 92, 246, 0.3);
  padding: 3px 8px;
  border-radius: 20px;
}

.meta-info {
  font-size: 12px;
  color: var(--text-muted);
}

.navigation-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* Tabs styles */
.tabs-nav {
  display: flex;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 4px;
  border-radius: var(--border-radius-sm);
  gap: 4px;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.tab-btn:hover:not(:disabled) {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.03);
}

.tab-btn.active {
  color: #ffffff;
  background: var(--accent-primary);
  box-shadow: 0 2px 8px var(--accent-primary-glow);
}

.tab-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.lock-project-btn {
  padding: 8px 14px;
  font-size: 14px;
}

/* Main Content Panel */
.dashboard-main {
  min-height: calc(100vh - 180px);
}

.tab-panel {
  width: 100%;
}

.tab-panel.height-full {
  height: calc(100vh - 180px);
}

/* Animation utilities */
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

.animate-slide-up {
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    align-items: stretch;
    padding: 16px;
  }
  
  .navigation-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .tabs-nav {
    flex-direction: column;
    width: 100%;
  }
  
  .tab-btn {
    width: 100%;
    justify-content: center;
  }
}

</style>
