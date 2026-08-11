<template>
  <TresMesh 
    ref="meshRef" 
    :geometry="resolvedGeometry" 
    :scale="[scaleFactor, scaleFactor, scaleFactor]"
    cast-shadow 
    receive-shadow
  >
    <!-- Applied custom material depending on selected style -->
    <TresMeshStandardMaterial 
      v-bind="materialProps" 
    />
  </TresMesh>
</template>

<script setup>
import { ref, computed, watchEffect, unref } from 'vue'
import { useLoader } from '@tresjs/core'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader'
import * as THREE from 'three'

const props = defineProps({
  url: {
    type: String,
    required: true
  },
  materialStyle: {
    type: String,
    default: 'matte'
  },
  color: {
    type: String,
    default: '#8b5cf6'
  }
})

const emit = defineEmits(['model-loaded'])

const meshRef = ref(null)
const scaleFactor = ref(1)

// Load geometry using TresJS useLoader and Three.js STLLoader
const geometry = await useLoader(STLLoader, props.url)

// Safely extract the raw BufferGeometry from whatever format useLoader resolves to
const resolvedGeometry = computed(() => {
  const resolved = unref(geometry)
  if (!resolved) return null
  
  // Case 1: TresJS v5 reactive state object { state, isLoading, error }
  if (resolved.state) {
    return unref(resolved.state)
  }
  
  // Case 2: Array format
  if (Array.isArray(resolved)) {
    return unref(resolved[0])
  }
  
  // Case 3: Ref format
  if (resolved.value) {
    return resolved.value
  }
  
  // Case 4: Raw BufferGeometry
  return resolved
})

// Configure material properties dynamically based on style selection
const materialProps = computed(() => {
  const baseColor = props.color
  
  switch (props.materialStyle) {
    case 'chrome':
      return {
        color: baseColor,
        metalness: 0.95,
        roughness: 0.08,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1
      }
    case 'gold':
      return {
        color: '#f59e0b', // Amber/gold
        metalness: 0.9,
        roughness: 0.15,
        clearcoat: 0.5
      }
    case 'matte':
    default:
      return {
        color: baseColor,
        metalness: 0.2,
        roughness: 0.75
      }
  }
})

watchEffect(() => {
  const geom = resolvedGeometry.value
  console.log('DEBUG_GEOM_OBJECT:', geom)
  if (geom) {
    console.log('DEBUG_GEOM_CONSTRUCTOR:', geom.constructor ? geom.constructor.name : 'no-constructor')
    console.log('DEBUG_GEOM_CENTER_TYPE:', typeof geom.center)
    console.log('DEBUG_GEOM_IS_BUFFERGEOMETRY:', geom.isBufferGeometry)
    console.log('DEBUG_GEOM_KEYS:', Object.keys(geom))
    
    if (typeof geom.center === 'function') {
      // 1. Center geometry to local origin so rotation is clean
      geom.center()
      
      // 2. Recalculate vertex normals for accurate lighting
      geom.computeVertexNormals()
      
      // 3. Measure physical dimensions
      geom.computeBoundingBox()
      const bbox = geom.boundingBox
      const size = new THREE.Vector3()
      bbox.getSize(size)
      
      // 4. Smart fit: auto-scale so the largest dimension fits inside 3 units
      const maxDimension = Math.max(size.x, size.y, size.z)
      if (maxDimension > 0) {
        scaleFactor.value = 3.0 / maxDimension
      }
      
      // 5. Emit details back to viewer panel (for dimensions summary card)
      emit('model-loaded', {
        dimensions: {
          x: parseFloat(size.x.toFixed(2)),
          y: parseFloat(size.y.toFixed(2)),
          z: parseFloat(size.z.toFixed(2))
        },
        volume: calculateVolume(geom)
      })
    } else {
      console.warn('geom.center is NOT a function. Skipping processing.')
    }
  }
})

// Calculate approximate physical volume in cubic mm / cm
function calculateVolume(geom) {
  if (!geom.isBufferGeometry) return 0
  
  const position = geom.attributes.position
  const index = geom.index
  let volume = 0
  
  const p1 = new THREE.Vector3()
  const p2 = new THREE.Vector3()
  const p3 = new THREE.Vector3()
  
  if (index) {
    for (let i = 0; i < index.count; i += 3) {
      const idx1 = index.getX(i)
      const idx2 = index.getX(i + 1)
      const idx3 = index.getX(i + 2)
      
      p1.fromBufferAttribute(position, idx1)
      p2.fromBufferAttribute(position, idx2)
      p3.fromBufferAttribute(position, idx3)
      
      volume += signedVolumeOfTriangle(p1, p2, p3)
    }
  } else {
    for (let i = 0; i < position.count; i += 3) {
      p1.fromBufferAttribute(position, i)
      p2.fromBufferAttribute(position, i + 1)
      p3.fromBufferAttribute(position, i + 2)
      
      volume += signedVolumeOfTriangle(p1, p2, p3)
    }
  }
  
  // Convert cubic mm to cubic cm (if size is mm-based, volume / 1000)
  return Math.abs(volume / 6.0) / 1000
}

function signedVolumeOfTriangle(p1, p2, p3) {
  return p1.dot(p2.cross(p3))
}
</script>
