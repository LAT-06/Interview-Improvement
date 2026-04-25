<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { ApplicationRepository } from '../repositories/ApplicationRepository';
import type { InterviewQuestion } from '../models/types';

interface PublicQuestion extends InterviewQuestion {
  applications: {
    company_name: string;
  };
}

const questions = ref<PublicQuestion[]>([]);
const isLoading = ref(true);
const searchQuery = ref('');

async function loadPublicQuestions() {
  try {
    isLoading.value = true;
    questions.value = await ApplicationRepository.getPublicQuestions() as PublicQuestion[];
  } catch (error) {
    console.error('Failed to load community questions:', error);
  } finally {
    isLoading.value = false;
  }
}

const filteredQuestions = computed(() => {
  if (!searchQuery.value) return questions.value;
  const query = searchQuery.value.toLowerCase();
  return questions.value.filter(q => 
    q.question.toLowerCase().includes(query) || 
    q.applications?.company_name.toLowerCase().includes(query)
  );
});

onMounted(loadPublicQuestions);
</script>

<template>
  <div>
    <div class="mb-12">
      <h1 class="text-3xl font-light tracking-tight text-slate-800 mb-2">Community Questions</h1>
      <p class="text-slate-400 font-light mb-8">Shared by others to help everyone improve.</p>
      
      <div class="relative">
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="Search shared questions or companies..."
          class="w-full max-w-md border-b border-slate-200 focus:border-slate-800 outline-none py-2 text-sm transition-colors bg-transparent"
        />
      </div>
    </div>

    <div v-if="isLoading" class="text-slate-400 font-light">Loading community bank...</div>
    
    <div v-else-if="filteredQuestions.length === 0" class="text-center py-20 border border-dashed border-slate-200 rounded-lg">
      <p class="text-slate-400">No public questions yet. Be the first to share one!</p>
    </div>

    <div v-else class="space-y-16">
      <div v-for="q in filteredQuestions" :key="q.id" class="border-l-2 border-slate-100 pl-8">
        <div class="flex justify-between items-center mb-3">
          <span class="text-[10px] uppercase tracking-[0.2em] text-indigo-500 font-bold">
            {{ q.applications?.company_name || 'Verified Question' }}
          </span>
          <span class="text-[10px] text-slate-300 font-mono">
            {{ new Date(q.created_at).toLocaleDateString() }}
          </span>
        </div>
        
        <h3 class="text-xl font-medium text-slate-800 mb-6 leading-relaxed">{{ q.question }}</h3>
        
        <div class="grid grid-cols-1 gap-6">
          <div v-if="q.ideal_answer" class="bg-slate-50 p-6 rounded-lg border border-slate-100 relative overflow-hidden group">
            <div class="absolute top-0 left-0 w-1 h-full bg-green-400 opacity-50"></div>
            <p class="text-[10px] uppercase tracking-widest text-green-600 mb-3 font-bold">Ideal Answer</p>
            <p class="text-sm text-slate-600 leading-relaxed italic">"{{ q.ideal_answer }}"</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
