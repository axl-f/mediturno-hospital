<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  year: number
  month: number
  diasDisponibles: string[] // formato YYYY-MM-DD
  selectedDate?: string
}>()

const emit = defineEmits<{
  (e: 'select', date: string): void
}>()

const diasSemana = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

const diasMes = computed(() => {
  const daysInMonth = new Date(props.year, props.month, 0).getDate()
  const firstDay = new Date(props.year, props.month - 1, 1).getDay()
  // Ajustar domingo a 7 para que el lunes sea 1
  const startOffset = firstDay === 0 ? 6 : firstDay - 1
  
  const days = []
  
  // padding start
  for (let i = 0; i < startOffset; i++) {
    days.push(null)
  }
  
  const today = new Date()
  today.setHours(0,0,0,0)

  // days
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(props.year, props.month - 1, i)
    const dateStr = `${props.year}-${String(props.month).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    
    days.push({
      dateStr,
      num: i,
      isPast: d < today,
      isAvailable: props.diasDisponibles.includes(dateStr)
    })
  }
  
  return days
})

const isSelected = (dateStr: string) => props.selectedDate === dateStr

const handleClick = (day: any) => {
  if (day && day.isAvailable && !day.isPast) {
    emit('select', day.dateStr)
  }
}
</script>

<template>
  <div class="calendar-grid">
    <div class="weekdays">
      <span v-for="d in diasSemana" :key="d">{{ d }}</span>
    </div>
    
    <div class="days">
      <button 
        v-for="(day, idx) in diasMes" 
        :key="idx"
        class="day-cell"
        :class="{
          empty: !day,
          past: day?.isPast,
          available: day?.isAvailable && !day?.isPast,
          selected: day && isSelected(day.dateStr)
        }"
        :disabled="!day || day.isPast || !day.isAvailable"
        @click="handleClick(day)"
      >
        <span v-if="day">{{ day.num }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.calendar-grid {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: var(--text-caption);
  color: var(--color-text-secondary);
  margin-bottom: 8px;
  font-weight: bold;
}

.days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.day-cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text);
  cursor: pointer;
  min-width: 40px;
  min-height: 40px;
}

@media (min-width: 768px) {
  .day-cell {
    min-width: 44px;
    min-height: 44px;
    font-size: 1.125rem;
  }
}

.day-cell.empty {
  visibility: hidden;
}

.day-cell.past, .day-cell:disabled {
  color: var(--color-text-disabled);
  background: var(--color-bg);
  cursor: not-allowed;
}

.day-cell.available {
  background: var(--color-success-light);
  color: var(--color-success);
  border-color: var(--color-success);
}
.day-cell.available:hover:not(:disabled) {
  transform: scale(1.05);
}

.day-cell.selected {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}
</style>
