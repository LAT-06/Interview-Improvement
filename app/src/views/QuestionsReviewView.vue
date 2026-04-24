<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { ApplicationRepository } from '../repositories/ApplicationRepository';
import type { InterviewQuestion } from '../models/types';

interface QuestionWithCompany extends InterviewQuestion {
  applications: {
    company_name: string;
  };
}

const questions = ref<QuestionWithCompany[]>([]);
const isLoading = ref(true);
const searchQuery = ref('');

async function loadQuestions() {
  try {
    isLoading.value = true;
    questions.value = await ApplicationRepository.getAllQuestions() as QuestionWithCompany[];
  } catch (error) {
    console.error('Failed to load questions:', error);
  } finally {
    isLoading.value = false;
  }
}

const filteredQuestions = computed(() => {
  if (!searchQuery.value) return questions.value;
  const query = searchQuery.value.toLowerCase();
  return questions.value.filter(q => 
    q.question.toLowerCase().includes(query) || 
    q.applications.company_name.toLowerCase().includes(query)
  );
});

onMounted(loadQuestions);
</script>

<template>
  <div>
    <div class="mb-12">
      <router-link to="/" class="text-xs uppercase tracking-widest text-slate-400 hover:text-slate-800 transition-colors mb-4 inline-block">
        &larr; Back to Dashboard
      </router-link>
      <h1 class="text-3xl font-light tracking-tight text-slate-800 mb-6">Question Bank</h1>
      
      <div class="relative">
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="Search questions or companies..."
          class="w-full max-w-md border-b border-slate-200 focus:border-slate-800 outline-none py-2 text-sm transition-colors bg-transparent"
        />
      </div>
    </div>

    <div v-if="isLoading" class="text-slate-400 font-light">Loading questions...</div>
    
    <div v-else-if="filteredQuestions.length === 0" class="text-center py-20 border border-dashed border-slate-200 rounded-lg">
      <p class="text-slate-400">No questions found.</p>
    </div>

    <div v-else class="space-y-12">
      <div v-for="q in filteredQuestions" :key="q.id" class="group">
        <div class="flex justify-between items-start mb-2">
          <span class="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">
            {{ q.applications?.company_name || 'General' }}
          </span>
          <router-link 
            :to="`/application/${q.application_id}`"
            class="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-800 font-bold"
          >
            View Application &rarr;
          </router-link>
        </div>
        
        <h3 class="text-lg font-medium text-slate-800 mb-4 leading-snug">{{ q.question }}</h3>
        
        <div v-if="q.llm_feedback || q.ideal_answer" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-if="q.llm_feedback" class="bg-slate-50 p-4 rounded-sm border border-slate-100">
            <p class="text-[10px] uppercase tracking-widest text-slate-400 mb-2 font-bold">Feedback</p>
            <p class="text-sm text-slate-600 leading-relaxed">{{ q.llm_feedback }}</p>
          </div>
          <div v-if="q.ideal_answer" class="bg-slate-50 p-4 rounded-sm border border-slate-100">
            <p class="text-[10px] uppercase tracking-widest text-slate-400 mb-2 font-bold">Ideal Answer</p>
            <p class="text-sm text-slate-600 leading-relaxed">{{ q.ideal_answer }}</p>
          </div>
        </div>
        
        <div v-else class="text-xs text-slate-400 italic">
          No feedback generated yet.
        </div>
      </div>
    </div>
  </div>
</template>
