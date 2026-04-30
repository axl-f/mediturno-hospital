<script setup lang="ts">
defineProps<{
  title: string
  value: number | string
  trend?: string
  trendUp?: boolean
}>()
</script>

<template>
  <div class="metric-card">
    <div class="metric-title">{{ title }}</div>
    <div class="metric-value">{{ value }}</div>
    <div v-if="trend" class="metric-trend" :class="{ 'trend-up': trendUp, 'trend-down': trendUp === false }">
      <span v-if="trendUp !== undefined">{{ trendUp ? '↑' : '↓' }}</span>
      {{ trend }}
    </div>
  </div>
</template>

<style scoped>
.metric-card {
  background: white;
  border-radius: var(--radius-sm);
  padding: 1.5rem;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metric-title {
  font-size: var(--text-label);
  color: var(--color-text-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value {
  font-size: 2rem;
  font-weight: bold;
  font-family: var(--font-display);
  color: var(--color-primary);
}

.metric-trend {
  font-size: var(--text-caption);
  font-weight: 500;
}
.trend-up { color: var(--color-success); }
.trend-down { color: var(--color-danger); }
</style>
