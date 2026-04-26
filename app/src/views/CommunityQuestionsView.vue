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

const questions = ref<QuestionWithCompany[]>([]);
const isLoading = ref(true);
const searchQuery = ref('');
const selectedCompany = ref('All Companies');
const selectedPosition = ref('All Positions');

async function loadPublicQuestions() {
  try {
    isLoading.value = true;
    questions.value = await ApplicationRepository.getPublicQuestions() as QuestionWithCompany[];
  } catch (error) {
    console.error('Failed to load community questions:', error);
  } finally {
    isLoading.value = false;
  }
}

const uniqueCompanies = computed(() => {
  const companies = questions.value.map(q => q.applications?.company_name).filter(Boolean);
  return ['All Companies', ...new Set(companies)];
});

const uniquePositions = computed(() => {
  const positions = questions.value.map(q => q.applications?.position).filter(Boolean);
  return ['All Positions', ...new Set(positions)];
});

const filteredQuestions = computed(() => {
  return questions.value.filter(q => {
    const matchesSearch = !searchQuery.value || 
      q.question.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      q.applications?.company_name.toLowerCase().includes(searchQuery.value.toLowerCase());
    
    const matchesCompany = selectedCompany.value === 'All Companies' || 
      q.applications?.company_name === selectedCompany.value;
      
    const matchesPosition = selectedPosition.value === 'All Positions' || 
      q.applications?.position === selectedPosition.value;

    return matchesSearch && matchesCompany && matchesPosition;
  });
});

onMounted(loadPublicQuestions);
</script>

<template>
  <div>
    <div class="mb-12">
      <h1 class="text-3xl font-light tracking-tight text-slate-800 mb-2">Community Questions</h1>
      <p class="text-slate-400 font-light mb-8">Shared by others to help everyone improve.</p>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div class="relative">
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Search questions..."
            class="w-full pl-4 pr-4 py-2.5 bg-[#F3F4F6] border-none rounded-xl text-sm focus:ring-2 focus:ring-[#84A26C] outline-none transition-all"
          />
        </div>
        
        <select 
          v-model="selectedCompany"
          class="w-full px-4 py-2.5 bg-[#F3F4F6] border-none rounded-xl text-sm focus:ring-2 focus:ring-[#84A26C] outline-none transition-all appearance-none cursor-pointer"
        >
          <option v-for="company in uniqueCompanies" :key="company" :value="company">{{ company }}</option>
        </select>

        <select 
          v-model="selectedPosition"
          class="w-full px-4 py-2.5 bg-[#F3F4F6] border-none rounded-xl text-sm focus:ring-2 focus:ring-[#84A26C] outline-none transition-all appearance-none cursor-pointer"
        >
          <option v-for="pos in uniquePositions" :key="pos" :value="pos">{{ pos }}</option>
        </select>
      </div>
    </div>

    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4D5E3F]"></div>
    </div>

    <div v-else-if="filteredQuestions.length === 0" class="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
      <p class="text-slate-400">No questions found matching your filters.</p>
    </div>

    <div v-else class="space-y-6">
      <div v-for="q in filteredQuestions" :key="q.id" class="bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-md transition-all group">
        <div class="flex justify-between items-start mb-4">
          <div class="flex flex-col">
            <span class="text-[10px] uppercase tracking-widest font-bold text-[#688055]">
              {{ q.applications?.company_name }}
            </span>
            <span class="text-[9px] text-slate-400 uppercase tracking-tighter">{{ q.applications?.position }}</span>
          </div>
        </div>
        
        <h3 class="text-lg font-medium text-slate-800 mb-4">{{ q.question }}</h3>
        
        <div v-if="q.ideal_answer" class="mt-4 p-4 bg-[#F3F4F6] rounded-xl border border-slate-100">
          <p class="text-[10px] uppercase tracking-widest text-[#4D5E3F] mb-2 font-bold">Ideal Answer</p>
          <p class="text-sm text-slate-600 leading-relaxed">{{ q.ideal_answer }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
