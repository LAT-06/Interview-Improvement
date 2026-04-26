<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { ApplicationRepository } from '../repositories/ApplicationRepository';
import type { InterviewQuestion } from '../models/types';

interface QuestionWithCompany extends InterviewQuestion {
  applications: {
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
    allQuestions.value = await ApplicationRepository.getPublicQuestions() as QuestionWithCompany[];
  } catch (error) {
    console.error('Failed to load community questions:', error);
  } finally {
    isLoading.value = false;
  }
}

const uniqueCompanies = computed(() => {
  const companies = allQuestions.value.map(q => q.applications?.company_name).filter(Boolean);
  return [...new Set(companies)].sort();
});

const uniquePositions = computed(() => {
  // Lọc vị trí dựa trên công ty đã chọn (nếu có)
  const filteredData = selectedCompany.value 
    ? allQuestions.value.filter(q => q.applications?.company_name === selectedCompany.value)
    : allQuestions.value;
    
  const positions = filteredData.map(q => q.applications?.position).filter(Boolean);
  return [...new Set(positions)].sort();
});

const filteredQuestions = computed(() => {
  // Nếu chưa chọn gì thì không hiện câu hỏi nào
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

    <!-- Selection Panel -->
    <div class="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 mb-12">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Company Selector -->
        <div>
          <label class="block text-[10px] uppercase tracking-[0.2em] text-[#688055] font-bold mb-4">Target Company</label>
          <div class="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            <button 
              @click="selectedCompany = ''"
              :class="['w-full text-left px-4 py-3 rounded-xl transition-all text-sm font-medium', !selectedCompany ? 'bg-[#4D5E3F] text-white shadow-md' : 'bg-[#F3F4F6] text-slate-500 hover:bg-slate-200']"
            >
              All Companies
            </button>
            <button 
              v-for="company in uniqueCompanies" 
              :key="company"
              @click="selectedCompany = company"
              :class="['w-full text-left px-4 py-3 rounded-xl transition-all text-sm font-medium', selectedCompany === company ? 'bg-[#4D5E3F] text-white shadow-md' : 'bg-[#F3F4F6] text-slate-500 hover:bg-slate-200']"
            >
              {{ company }}
            </button>
          </div>
        </div>

        <!-- Position Selector -->
        <div>
          <label class="block text-[10px] uppercase tracking-[0.2em] text-[#688055] font-bold mb-4">Job Field / Major</label>
          <div class="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            <button 
              @click="selectedPosition = ''"
              :class="['w-full text-left px-4 py-3 rounded-xl transition-all text-sm font-medium', !selectedPosition ? 'bg-[#4D5E3F] text-white shadow-md' : 'bg-[#F3F4F6] text-slate-500 hover:bg-slate-200']"
            >
              All Positions
            </button>
            <button 
              v-for="pos in uniquePositions" 
              :key="pos"
              @click="selectedPosition = pos"
              :class="['w-full text-left px-4 py-3 rounded-xl transition-all text-sm font-medium', selectedPosition === pos ? 'bg-[#4D5E3F] text-white shadow-md' : 'bg-[#F3F4F6] text-slate-500 hover:bg-slate-200']"
            >
              {{ pos }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Results Area -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4D5E3F]"></div>
    </div>

    <div v-else-if="!hasFilters" class="text-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
      <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-300"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      </div>
      <p class="text-slate-400 font-light">Please select a company or job field to see relevant questions.</p>
    </div>

    <div v-else-if="filteredQuestions.length === 0" class="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
      <p class="text-slate-500">No shared questions found for this selection.</p>
      <button @click="selectedCompany = ''; selectedPosition = ''" class="mt-4 text-xs font-bold uppercase tracking-widest text-[#688055] hover:text-[#4D5E3F]">Clear Filters</button>
    </div>

    <div v-else class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div class="flex justify-between items-center mb-4 px-2">
        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">{{ filteredQuestions.length }} Questions Found</p>
        <button @click="selectedCompany = ''; selectedPosition = ''" class="text-[10px] font-bold uppercase text-red-400 hover:text-red-600 transition-colors">Reset</button>
      </div>

      <div v-for="q in filteredQuestions" :key="q.id" class="bg-white border border-slate-100 rounded-3xl p-8 hover:shadow-xl transition-all shadow-sm group">
        <div class="flex justify-between items-start mb-6">
          <div class="flex items-center gap-3">
            <div class="px-3 py-1 bg-[#F3F4F6] rounded-lg text-[10px] font-bold text-[#4D5E3F] uppercase tracking-wider">
              {{ q.applications?.company_name }}
            </div>
            <div class="px-3 py-1 bg-[#688055]/10 rounded-lg text-[10px] font-bold text-[#688055] uppercase tracking-wider">
              {{ q.applications?.position }}
            </div>
          </div>
        </div>
        
        <h3 class="text-xl font-medium text-slate-800 mb-6 leading-relaxed">{{ q.question }}</h3>
        
        <div v-if="q.ideal_answer" class="p-6 bg-[#F3F4F6] rounded-2xl border border-slate-50">
          <p class="text-[10px] uppercase tracking-widest text-[#4D5E3F] mb-3 font-bold">Recommended Approach</p>
          <p class="text-sm text-slate-600 leading-relaxed">{{ q.ideal_answer }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
