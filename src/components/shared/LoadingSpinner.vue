<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  size?: 'sm' | 'md' | 'lg'
  color?: string
}>()

const sizeMap = {
  sm: '16px',
  md: '24px',
  lg: '40px'
}

const currentSize = computed(() => sizeMap[props.size || 'md'])
</script>

<template>
  <svg 
    class="loading-spinner" 
    :width="currentSize" 
    :height="currentSize" 
    viewBox="0 0 50 50"
  >
    <circle 
      class="path" 
      cx="25" cy="25" r="20" 
      fill="none" 
      stroke-width="5"
      :stroke="color || 'var(--color-primary)'"
    ></circle>
  </svg>
</template>

<style scoped>
.loading-spinner {
  animation: rotate 2s linear infinite;
}

.path {
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes rotate {
  100% { transform: rotate(360deg); }
}

@keyframes dash {
  0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
  50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
  100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
}
</style>
