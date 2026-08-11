<template>
  <div class="home-container">
    <div class="glow-orb primary-orb"></div>
    <div class="glow-orb secondary-orb"></div>
    
    <div class="glass-panel search-card">
      <div class="brand-header">
        <div class="logo-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-box"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        </div>
        <h1>RenderVault</h1>
        <p class="subtitle">Secure 3D & Multimedia Client Portals</p>
      </div>

      <form @submit.prevent="handleSubmit" class="search-form">
        <div class="form-group">
          <label class="form-label" for="slug">Project URL Slug</label>
          <div class="input-wrapper">
            <span class="url-prefix">rendervault.com/p/</span>
            <input 
              v-model="slug" 
              type="text" 
              id="slug" 
              class="input-field" 
              placeholder="my-project-slug" 
              required
              :class="{ 'input-error': error }"
              @input="error = ''"
            />
          </div>
          <span v-if="error" class="error-text">{{ error }}</span>
        </div>

        <button type="submit" class="btn btn-primary btn-block">
          Access Portal
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </button>
      </form>

      <div class="footer-note">
        <p>Need access? Contact your project administrator to receive your private link and PIN.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const slug = ref('')
const error = ref('')

const handleSubmit = () => {
  const cleanSlug = slug.value.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '')
  if (!cleanSlug) {
    error.value = 'Please enter a valid project slug.'
    return
  }
  router.push(`/p/${cleanSlug}`)
}
</script>

<style scoped>
.home-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* Background Glowing Orbs */
.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.15;
  z-index: 0;
  pointer-events: none;
}

.primary-orb {
  top: 20%;
  left: 20%;
  width: 350px;
  height: 350px;
  background-color: var(--accent-primary);
}

.secondary-orb {
  bottom: 20%;
  right: 20%;
  width: 400px;
  height: 400px;
  background-color: var(--accent-secondary);
}

.search-card {
  width: 100%;
  max-width: 480px;
  padding: 40px;
  position: relative;
  z-index: 10;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--glass-shadow);
  text-align: center;
  animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.brand-header {
  margin-bottom: 32px;
}

.logo-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: radial-gradient(circle, var(--accent-primary) 0%, transparent 80%);
  border-radius: 50%;
  color: var(--accent-secondary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 16px;
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.2);
}

.logo-icon svg {
  animation: float 4s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

h1 {
  font-size: 28px;
  margin-bottom: 6px;
  background: linear-gradient(135deg, var(--text-primary) 30%, var(--accent-secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 14px;
  color: var(--text-secondary);
}

.search-form {
  margin-bottom: 24px;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background: rgba(15, 22, 36, 0.5);
  border: 1px solid var(--glass-border);
  border-radius: var(--border-radius-sm);
  padding: 0 16px;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.input-wrapper:focus-within {
  border-color: var(--glass-border-focus);
  box-shadow: 0 0 0 4px var(--accent-primary-glow);
}

.url-prefix {
  font-size: 14px;
  color: var(--text-muted);
  user-select: none;
}

.input-field {
  flex: 1;
  background: transparent;
  border: none;
  padding: 12px 8px;
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 15px;
  outline: none;
}

.input-field:focus {
  box-shadow: none;
}

.input-error {
  border-color: var(--color-danger) !important;
}

.error-text {
  display: block;
  font-size: 13px;
  color: var(--color-danger);
  margin-top: 6px;
}

.btn-block {
  width: 100%;
  padding: 12px 20px;
}

.footer-note {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 20px;
}

.footer-note p {
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-muted);
}
</style>
