<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { ApplicationRepository } from '../repositories/ApplicationRepository';
import type { InterviewQuestion } from '../models/types';

interface QuestionWithCompany extends InterviewQuestion {
  applications?: {
    company_name: string;
    position: string;
  };
}

const allQuestions = ref<QuestionWithCompany[]>([]);
const isLoading = ref(true);
const selectedCompany = ref('');
const selectedPosition = ref('');

async function loadPublicQuestions() {
  try {
    isLoading.value = true;
    const data = await ApplicationRepository.getPublicQuestions();
    // Debug để kiểm tra cấu trúc dữ liệu trả về từ Supabase qua Backend
    console.log('Community Data received:', data);
    allQuestions.value = data as QuestionWithCompany[];
  } catch (error) {
    console.error('Failed to load community questions:', error);
  } finally {
    isLoading.value = false;
  }
}

const uniqueCompanies = computed(() => {
  const companies = allQuestions.value
    .map(q => q.applications?.company_name)
    .filter(Boolean) as string[];
  return [...new Set(companies)].sort();
});

const uniquePositions = computed(() => {
  const filteredData = selectedCompany.value 
    ? allQuestions.value.filter(q => q.applications?.company_name === selectedCompany.value)
    : allQuestions.value;
    
  const positions = filteredData
    .map(q => q.applications?.position)
    .filter(Boolean) as string[];
  return [...new Set(positions)].sort();
});

const filteredQuestions = computed(() => {
  if (!selectedCompany.value && !selectedPosition.value) return [];
  
  return allQuestions.value.filter(q => {
    const matchesCompany = !selectedCompany.value || q.applications?.company_name === selectedCompany.value;
    const matchesPosition = !selectedPosition.value || q.applications?.position === selectedPosition.value;
    return matchesCompany && matchesPosition;
  });
});

const hasFilters = computed(() => selectedCompany.value || selectedPosition.value);

onMounted(loadPublicQuestions);
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <div class="mb-12 text-center">
      <h1 class="text-4xl font-light tracking-tight text-slate-800 mb-3">Community Insights</h1>
      <p class="text-slate-400 font-light">Select a target to discover interview questions from others.</p>
    </div>

    <!-- Interactive Selection Panel -->
    <div class="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 mb-12">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
        <!-- Company Column -->
        <div>
          <div class="flex justify-between items-center mb-6">
            <label class="text-[10px] uppercase tracking-[0.2em] text-[#688055] font-bold">1. Target Company</label>
            <button v-if="selectedCompany" @click="selectedCompany = ''" class="text-[9px] font-bold text-red-400 uppercase tracking-widest hover:text-red-600">Clear</button>
          </div>
          
          <div v-if="uniqueCompanies.length === 0 && !isLoading" class="py-4 text-xs text-slate-400 italic text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No companies shared yet.
          </div>
          
          <div class="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            <button 
              v-for="company in uniqueCompanies" 
              :key="company"
              @click="selectedCompany = company"
              :class="['text-left px-5 py-3.5 rounded-2xl transition-all text-sm font-medium border flex justify-between items-center group', 
                       selectedCompany === company 
                       ? 'bg-[#4D5E3F] text-white border-[#4D5E3F] shadow-lg' 
                       : 'bg-[#F3F4F6] text-slate-600 border-transparent hover:border-[#84A26C] hover:bg-white']"
            >
              {{ company }}
              <svg v-if="selectedCompany === company" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              <span v-else class="opacity-0 group-hover:opacity-100 text-[9px] uppercase tracking-widest text-[#84A26C]">Select</span>
            </button>
          </div>
        </div>

        <!-- Position Column -->
        <div>
          <div class="flex justify-between items-center mb-6">
            <label class="text-[10px] uppercase tracking-[0.2em] text-[#688055] font-bold">2. Job Field / Major</label>
            <button v-if="selectedPosition" @click="selectedPosition = ''" class="text-[9px] font-bold text-red-400 uppercase tracking-widest hover:text-red-600">Clear</button>
          </div>

          <div v-if="uniquePositions.length === 0 && !isLoading" class="py-4 text-xs text-slate-400 italic text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            Select a company to see positions.
          </div>

          <div class="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            <button 
              v-for="pos in uniquePositions" 
              :key="pos"
              @click="selectedPosition = pos"
              :class="['text-left px-5 py-3.5 rounded-2xl transition-all text-sm font-medium border flex justify-between items-center group', 
                       selectedPosition === pos 
                       ? 'bg-[#688055] text-white border-[#688055] shadow-lg' 
                       : 'bg-[#F3F4F6] text-slate-600 border-transparent hover:border-[#84A26C] hover:bg-white']"
            >
              {{ pos }}
              <svg v-if="selectedPosition === pos" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              <span v-else class="opacity-0 group-hover:opacity-100 text-[9px] uppercase tracking-widest text-[#84A26C]">Select</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Results Area -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4D5E3F]"></div>
    </div>

    <div v-else-if="!hasFilters" class="text-center py-24 bg-white/40 rounded-[3rem] border-2 border-dashed border-slate-200">
      <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-50">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-slate-300"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      </div>
      <h3 class="text-lg font-medium text-slate-600 mb-2">Ready to explore?</h3>
      <p class="text-slate-400 font-light max-w-xs mx-auto">Please select a company or job field from the panel above to view shared interview questions.</p>
    </div>

    <div v-else-if="filteredQuestions.length === 0" class="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
      <p class="text-slate-500 font-medium">No shared questions found for this specific combination.</p>
      <button @click="selectedCompany = ''; selectedPosition = ''" class="mt-6 px-6 py-2.5 bg-[#F3F4F6] text-[#4D5E3F] rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-200 transition-all">Clear All Filters</button>
    </div>

    <div v-else class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div class="flex justify-between items-center px-4">
        <div class="flex items-center gap-4">
          <span class="text-2xl font-light text-slate-800">{{ filteredQuestions.length }} Results</span>
          <div class="h-4 w-px bg-slate-200"></div>
          <span v-if="selectedCompany" class="text-xs font-bold text-[#4D5E3F] uppercase tracking-widest">{{ selectedCompany }}</span>
          <span v-if="selectedPosition" class="text-xs font-bold text-[#688055] uppercase tracking-widest">{{ selectedPosition }}</span>
        </div>
      </div>

      <div v-for="q in filteredQuestions" :key="q.id" class="bg-white border border-slate-100 rounded-[2rem] p-10 hover:shadow-2xl transition-all shadow-md group border-l-4 border-l-[#4D5E3F]">
        <div class="flex justify-between items-start mb-8">
          <div class="flex flex-wrap gap-2">
            <span class="px-4 py-1.5 bg-[#F3F4F6] rounded-full text-[10px] font-bold text-[#4D5E3F] uppercase tracking-widest">
              {{ q.applications?.company_name }}
            </span>
            <span class="px-4 py-1.5 bg-[#688055]/5 rounded-full text-[10px] font-bold text-[#688055] uppercase tracking-widest">
              {{ q.applications?.position }}
            </span>
          </div>
        </div>
        
        <h3 class="text-2xl font-light text-slate-800 mb-8 leading-relaxed">{{ q.question }}</h3>
        
        <div v-if="q.ideal_answer" class="p-8 bg-[#F3F4F6] rounded-2xl border border-slate-50 relative overflow-hidden">
          <div class="absolute top-0 right-0 p-4 opacity-5">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
          </div>
          <p class="text-[10px] uppercase tracking-[0.3em] text-[#4D5E3F] mb-4 font-bold">Recommended Solution</p>
          <p class="text-slate-600 leading-relaxed">{{ q.ideal_answer }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}
</style>
