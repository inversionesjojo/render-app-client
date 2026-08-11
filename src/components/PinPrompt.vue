<template>
  <div class="pin-wrapper">
    <div class="pin-card glass-panel" :class="{ 'animate-shake': isShaking }">
      <div class="pin-header">
        <div class="lock-icon" :class="{ 'unlocked': isSuccess }">
          <svg v-if="!isSuccess" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
        </div>
        <h2>Project Access Gate</h2>
        <p class="project-title">{{ projectTitle }}</p>
        <p class="instruction-text">Enter the security PIN provided by your administrator</p>
      </div>

      <!-- Password Dots Indicator -->
      <div class="dots-container">
        <span 
          v-for="i in maxPinLength" 
          :key="i" 
          class="dot" 
          :class="{ 'active': pin.length >= i, 'success': isSuccess, 'error': isError }"
        ></span>
      </div>

      <!-- Error Message -->
      <div class="message-area">
        <span v-if="errorMsg" class="error-message">{{ errorMsg }}</span>
        <span v-else-if="isSuccess" class="success-message">Access Granted! Unlocking...</span>
        <span v-else class="placeholder-msg">&nbsp;</span>
      </div>

      <!-- Numeric Keypad Grid -->
      <div class="keypad-grid">
        <button 
          v-for="num in [1, 2, 3, 4, 5, 6, 7, 8, 9]" 
          :key="num" 
          type="button" 
          class="keypad-btn" 
          @click="pressKey(num.toString())"
          :disabled="isSubmitting || isSuccess"
        >
          {{ num }}
        </button>
        
        <button 
          type="button" 
          class="keypad-btn utility-btn" 
          @click="clearAll"
          :disabled="isSubmitting || isSuccess || !pin"
        >
          C
        </button>
        
        <button 
          type="button" 
          class="keypad-btn" 
          @click="pressKey('0')"
          :disabled="isSubmitting || isSuccess"
        >
          0
        </button>
        
        <button 
          type="button" 
          class="keypad-btn utility-btn" 
          @click="backspace"
          :disabled="isSubmitting || isSuccess || !pin"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><path d="m18 9-6 6"/><path d="m12 9 6 6"/></svg>
        </button>
      </div>

      <div class="action-section">
        <button 
          class="btn btn-primary btn-block" 
          @click="verifyPin" 
          :disabled="pin.length === 0 || isSubmitting || isSuccess"
        >
          <span v-if="isSubmitting" class="spinner"></span>
          <span v-else>Verify PIN</span>
        </button>
        <button class="btn btn-secondary btn-block text-btn" @click="$router.push('/')">
          Back to Search
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  projectTitle: {
    type: String,
    required: true
  },
  expectedPin: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['unlock-success'])

const pin = ref('')
const maxPinLength = ref(props.expectedPin.length || 4)
const isSubmitting = ref(false)
const isSuccess = ref(false)
const isError = ref(false)
const isShaking = ref(false)
const errorMsg = ref('')

// Simple synthesizer for audio feedback using Web Audio API
const playTone = (frequency, duration, type = 'sine') => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)

    oscillator.type = type
    oscillator.frequency.value = frequency
    
    // Smooth gain ramp-down to prevent clicks
    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration)

    oscillator.start()
    oscillator.stop(audioCtx.currentTime + duration)
  } catch (e) {
    // Fail silently if audio context is blocked or not supported
  }
}

const pressKey = (char) => {
  if (pin.value.length < maxPinLength.value) {
    playTone(550, 0.08, 'triangle') // Subtle click tone
    pin.value += char
    errorMsg.value = ''
    isError.value = false
  }
}

const backspace = () => {
  if (pin.value.length > 0) {
    playTone(400, 0.08, 'triangle')
    pin.value = pin.value.slice(0, -1)
    errorMsg.value = ''
    isError.value = false
  }
}

const clearAll = () => {
  if (pin.value.length > 0) {
    playTone(300, 0.12, 'sine')
    pin.value = ''
    errorMsg.value = ''
    isError.value = false
  }
}

const verifyPin = () => {
  if (pin.value.length === 0) return
  
  isSubmitting.value = true
  errorMsg.value = ''
  
  // Simulate network check delay
  setTimeout(() => {
    isSubmitting.value = false
    if (pin.value === props.expectedPin) {
      isSuccess.value = true
      isError.value = false
      playTone(880, 0.15, 'sine')
      setTimeout(() => playTone(1320, 0.3, 'sine'), 100) // Success chime
      
      setTimeout(() => {
        emit('unlock-success')
      }, 1000)
    } else {
      isError.value = true
      isShaking.value = true
      errorMsg.value = 'Incorrect security PIN. Please try again.'
      playTone(180, 0.3, 'sawtooth') // Error buzz
      
      setTimeout(() => {
        isShaking.value = false
      }, 500)
      
      // Auto-clear pin
      pin.value = ''
    }
  }, 600)
}

// Auto-submit when maximum length is typed
watch(pin, (newVal) => {
  if (newVal.length === maxPinLength.value) {
    verifyPin()
  }
})
</script>

<style scoped>
.pin-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  min-height: calc(100vh - 120px);
  position: relative;
  z-index: 10;
}

.pin-card {
  width: 100%;
  max-width: 420px;
  padding: 36px;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--glass-shadow);
  text-align: center;
  animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.pin-header {
  margin-bottom: 24px;
}

.lock-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text-secondary);
  margin-bottom: 16px;
  transition: all 0.4s ease;
}

.lock-icon.unlocked {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.3);
  color: var(--color-success);
  transform: scale(1.1);
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
}

h2 {
  font-size: 22px;
  margin-bottom: 4px;
}

.project-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--accent-secondary);
  margin-bottom: 8px;
}

.instruction-text {
  font-size: 13px;
  color: var(--text-secondary);
}

/* Dots Indicator */
.dots-container {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin: 20px 0;
  height: 14px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--text-muted);
  background: transparent;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dot.active {
  background: var(--text-primary);
  border-color: var(--text-primary);
  transform: scale(1.2);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.dot.success {
  background: var(--color-success) !important;
  border-color: var(--color-success) !important;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.5) !important;
}

.dot.error {
  background: var(--color-danger) !important;
  border-color: var(--color-danger) !important;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.5) !important;
}

/* Message Area */
.message-area {
  height: 24px;
  margin-bottom: 20px;
}

.error-message {
  font-size: 13px;
  color: var(--color-danger);
  font-weight: 500;
}

.success-message {
  font-size: 13px;
  color: var(--color-success);
  font-weight: 500;
}

.placeholder-msg {
  user-select: none;
}

/* Numeric Keypad Grid */
.keypad-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 28px;
}

.keypad-btn {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 20px;
  font-weight: 500;
  height: 56px;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  user-select: none;
  outline: none;
}

.keypad-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.12);
  transform: scale(1.05);
}

.keypad-btn:active:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(0.95);
}

.keypad-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.utility-btn {
  font-size: 15px;
  background: rgba(255, 255, 255, 0.01);
  color: var(--text-secondary);
}

.utility-btn svg {
  stroke-width: 2.2px;
}

/* Action Area */
.action-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.text-btn {
  background: transparent;
  border: none;
  font-size: 13px;
  color: var(--text-secondary);
  text-decoration: underline;
  padding: 8px;
}

.text-btn:hover {
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-primary);
  transform: none;
}
</style>
