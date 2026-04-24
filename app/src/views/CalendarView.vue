<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { ApplicationRepository } from '../repositories/ApplicationRepository';
import type { Application } from '../models/types';

const applications = ref<Application[]>([]);
const isLoading = ref(true);
const currentMonth = ref(new Date());

async function loadData() {
  try {
    isLoading.value = true;
    const allApps = await ApplicationRepository.getAll();
    applications.value = allApps.filter(app => app.interview_at);
  } catch (error) {
    console.error('Failed to load applications:', error);
  } finally {
    isLoading.value = false;
  }
}

const calendarDays = computed(() => {
  const year = currentMonth.value.getFullYear();
  const month = currentMonth.value.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const days = [];
  
  // Padding for previous month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push({ day: null, date: null });
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    const dayApps = applications.value.filter(app => {
      const interviewDate = new Date(app.interview_at!);
      return interviewDate.getFullYear() === year && 
             interviewDate.getMonth() === month && 
             interviewDate.getDate() === i;
    });
    days.push({ day: i, date, apps: dayApps });
  }
  
  return days;
});

const monthName = computed(() => {
  return currentMonth.value.toLocaleString('default', { month: 'long', year: 'numeric' });
});

function nextMonth() {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 1);
}

function prevMonth() {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() - 1, 1);
}

onMounted(loadData);
</script>

<template>
  <div>
    <div class="mb-12 flex justify-between items-center">
      <div>
        <router-link to="/" class="text-xs uppercase tracking-widest text-slate-400 hover:text-slate-800 transition-colors mb-4 inline-block">
          &larr; Back to Dashboard
        </router-link>
        <h1 class="text-3xl font-light tracking-tight text-slate-800">Interview Calendar</h1>
      </div>
      
      <div class="flex items-center gap-6">
        <button @click="prevMonth" class="text-slate-400 hover:text-slate-800">&larr;</button>
        <h2 class="text-lg font-medium text-slate-700 min-w-[150px] text-center">{{ monthName }}</h2>
        <button @click="nextMonth" class="text-slate-400 hover:text-slate-800">&rarr;</button>
      </div>
    </div>

    <div v-if="isLoading" class="text-slate-400 font-light text-center py-20">Loading calendar...</div>
    
    <div v-else class="border border-slate-100 rounded-lg overflow-hidden">
      <div class="grid grid-cols-7 bg-slate-50 border-b border-slate-100">
        <div v-for="day in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']" :key="day" class="py-3 text-center text-[10px] uppercase tracking-widest text-slate-400 font-bold">
          {{ day }}
        </div>
      </div>
      
      <div class="grid grid-cols-7">
        <div 
          v-for="(d, idx) in calendarDays" 
          :key="idx" 
          class="min-h-[120px] p-2 border-r border-b border-slate-50 last:border-r-0"
          :class="{'bg-slate-50/30': !d.day}"
        >
          <div v-if="d.day" class="flex flex-col h-full">
            <span class="text-xs font-medium text-slate-400 mb-2">{{ d.day }}</span>
            <div class="space-y-1">
              <router-link 
                v-for="app in d.apps" 
                :key="app.id"
                :to="`/application/${app.id}`"
                class="block p-1.5 bg-white border border-slate-100 rounded text-[10px] leading-tight hover:border-slate-300 transition-colors shadow-sm"
              >
                <div class="font-bold text-slate-700 truncate">{{ app.company_name }}</div>
                <div class="text-slate-400 truncate">{{ app.position }}</div>
                <div class="text-blue-400 mt-1 font-mono">
                  {{ new Date(app.interview_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
                </div>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
