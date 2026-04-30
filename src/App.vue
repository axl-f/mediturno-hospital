<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const transitionName = computed(() => (route.meta.transition as string) || 'slide-left')
</script>

<template>
  <RouterView v-slot="{ Component }">
    <transition :name="transitionName" mode="out-in">
      <component :is="Component" />
    </transition>
  </RouterView>
</template>

<style>
/* Transiciones de navegación */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active { 
  transition: all 250ms ease-out; 
}

.slide-left-enter-from { 
  transform: translateX(30px); 
  opacity: 0; 
}
.slide-left-leave-to { 
  transform: translateX(-30px); 
  opacity: 0; 
}

.slide-right-enter-from { 
  transform: translateX(-30px); 
  opacity: 0; 
}
.slide-right-leave-to { 
  transform: translateX(30px); 
  opacity: 0; 
}
</style>
