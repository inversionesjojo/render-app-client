<template>
  <div class="gallery-container">
    <!-- Empty State -->
    <div v-if="mediaList.length === 0" class="empty-gallery glass-panel">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="empty-icon"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
      <h3>No Media Files Uploaded</h3>
      <p>This project does not contain any images or videos yet.</p>
    </div>

    <!-- Media Grid -->
    <div v-else class="media-grid">
      <div 
        v-for="(item, index) in mediaList" 
        :key="item.id || index" 
        class="media-card glass-panel"
        @click="openLightbox(index)"
      >
        <!-- Media Visual Element -->
        <div class="media-preview">
          <img 
            v-if="item.type === 'image'" 
            :src="item.url" 
            :alt="item.name" 
            loading="lazy" 
          />
          <div v-else-if="item.type === 'video'" class="video-preview-wrapper">
            <video :src="item.url" muted preload="metadata" class="preview-video"></video>
            <div class="play-overlay-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>
            </div>
          </div>
          
          <!-- Hover Overlay -->
          <div class="hover-overlay">
            <span class="view-badge">
              <svg v-if="item.type === 'image'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
              {{ item.type === 'image' ? 'Zoom Image' : 'Play Video' }}
            </span>
          </div>
        </div>

        <!-- Info Footer -->
        <div class="media-info">
          <div class="media-meta">
            <span class="media-type-badge" :class="item.type">
              {{ item.type.toUpperCase() }}
            </span>
            <span class="media-size">{{ formatSize(item.size) }}</span>
          </div>
          <p class="media-name">{{ item.name }}</p>
        </div>
      </div>
    </div>

    <!-- Lightbox Modal Overlay -->
    <Transition name="fade">
      <div v-if="lightboxActive" class="lightbox" @click.self="closeLightbox">
        <div class="lightbox-close" @click="closeLightbox">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </div>

        <!-- Navigation Buttons -->
        <button class="nav-btn prev-btn" @click.stop="prevItem" :disabled="mediaList.length <= 1">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        
        <button class="nav-btn next-btn" @click.stop="nextItem" :disabled="mediaList.length <= 1">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>

        <!-- Lightbox Core Content -->
        <div class="lightbox-content" @click.stop>
          <Transition name="slide-fade" mode="out-in">
            <div :key="activeIndex" class="lightbox-media-wrapper">
              <!-- Image display -->
              <img 
                v-if="activeItem.type === 'image'" 
                :src="activeItem.url" 
                :alt="activeItem.name" 
                class="lightbox-img" 
              />
              
              <!-- Video display -->
              <video 
                v-else-if="activeItem.type === 'video'" 
                :src="activeItem.url" 
                controls 
                autoplay 
                class="lightbox-video"
              ></video>
              
              <!-- Caption bar -->
              <div class="lightbox-caption">
                <span class="media-type-badge" :class="activeItem.type">{{ activeItem.type.toUpperCase() }}</span>
                <span class="lightbox-title">{{ activeItem.name }}</span>
                <span class="lightbox-index">{{ activeIndex + 1 }} / {{ mediaList.length }}</span>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  mediaList: {
    type: Array,
    default: () => []
  }
})

const lightboxActive = ref(false)
const activeIndex = ref(0)

const activeItem = computed(() => {
  if (props.mediaList.length === 0) return null
  return props.mediaList[activeIndex.value]
})

const openLightbox = (index) => {
  activeIndex.value = index
  lightboxActive.value = true
  document.body.style.overflow = 'hidden' // Stop body scrolling
}

const closeLightbox = () => {
  lightboxActive.value = false
  document.body.style.overflow = '' // Restore body scrolling
}

const nextItem = () => {
  if (props.mediaList.length <= 1) return
  activeIndex.value = (activeIndex.value + 1) % props.mediaList.length
}

const prevItem = () => {
  if (props.mediaList.length <= 1) return
  activeIndex.value = (activeIndex.value - 1 + props.mediaList.length) % props.mediaList.length
}

// Key event listener for lightbox controls
const handleKeyDown = (e) => {
  if (!lightboxActive.value) return
  if (e.key === 'Escape') closeLightbox()
  if (e.key === 'ArrowRight') nextItem()
  if (e.key === 'ArrowLeft') prevItem()
}
window.addEventListener('keydown', handleKeyDown)

// Formatting helper
const formatSize = (bytes) => {
  if (!bytes) return 'N/A'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style scoped>
.gallery-container {
  width: 100%;
}

.empty-gallery {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  text-align: center;
  color: var(--text-secondary);
  border-radius: var(--border-radius-md);
  margin-top: 20px;
}

.empty-icon {
  color: var(--text-muted);
  margin-bottom: 16px;
  stroke-width: 1px;
}

.empty-gallery h3 {
  font-size: 20px;
  margin-bottom: 8px;
}

.empty-gallery p {
  font-size: 14px;
}

/* Media Grid */
.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-top: 8px;
}

.media-card {
  border-radius: var(--border-radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: transform var(--transition-fast), border-color var(--transition-fast);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
}

.media-card:hover {
  transform: translateY(-4px);
  border-color: rgba(139, 92, 246, 0.25);
}

.media-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 16/10;
  background: #090c15;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.media-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.media-card:hover .media-preview img {
  transform: scale(1.05);
}

.video-preview-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.preview-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-overlay-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 48px;
  height: 48px;
  background: rgba(13, 17, 28, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: var(--accent-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  padding-left: 2px; /* Visual centering adjustment for triangle symbol */
}

/* Hover overlays */
.hover-overlay {
  position: absolute;
  inset: 0;
  background: rgba(8, 12, 21, 0.6);
  backdrop-filter: blur(2px);
  opacity: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity var(--transition-fast);
}

.media-card:hover .hover-overlay {
  opacity: 1;
}

.view-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--accent-primary);
  color: #ffffff;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px var(--accent-primary-glow);
  transform: translateY(8px);
  transition: transform var(--transition-fast);
}

.media-card:hover .view-badge {
  transform: translateY(0);
}

/* Info Bar */
.media-info {
  padding: 16px;
  background: rgba(255, 255, 255, 0.01);
  border-top: 1px solid rgba(255, 255, 255, 0.03);
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.media-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.media-type-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.media-type-badge.image {
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.media-type-badge.video {
  background: rgba(6, 182, 212, 0.15);
  color: #22d3ee;
  border: 1px solid rgba(6, 182, 212, 0.3);
}

.media-size {
  font-size: 11px;
  color: var(--text-muted);
}

.media-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Lightbox Modal */
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(5, 7, 12, 0.95);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.lightbox-close {
  position: absolute;
  top: 24px;
  right: 24px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 50%;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-close:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
  transform: scale(1.05);
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 50%;
  color: var(--text-secondary);
  width: 48px;
  height: 48px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  z-index: 100;
}

.nav-btn:hover:not(:disabled) {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-50%) scale(1.05);
}

.nav-btn:disabled {
  opacity: 0.1;
  cursor: not-allowed;
}

.prev-btn { left: 24px; }
.next-btn { right: 24px; }

.lightbox-content {
  width: 100%;
  max-width: 1000px;
  max-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-media-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-height: 80vh;
  max-width: 100%;
}

.lightbox-img, .lightbox-video {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: var(--border-radius-sm);
  box-shadow: 0 10px 40px rgba(0,0,0,0.6);
}

.lightbox-caption {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 8px 16px;
  border-radius: 20px;
  width: max-content;
  max-width: 100%;
}

.lightbox-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lightbox-index {
  font-size: 12px;
  color: var(--text-muted);
  border-left: 1px solid rgba(255, 255, 255, 0.10);
  padding-left: 12px;
}

/* Animations */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.slide-fade-enter-active {
  transition: all 0.25s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}
.slide-fade-enter-from {
  transform: translateX(10px);
  opacity: 0;
}
.slide-fade-leave-to {
  transform: translateX(-10px);
  opacity: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .lightbox {
    padding: 20px;
  }
  .nav-btn {
    width: 38px;
    height: 38px;
  }
  .prev-btn { left: 8px; }
  .next-btn { right: 8px; }
  .lightbox-close {
    top: 16px;
    right: 16px;
  }
}
</style>
