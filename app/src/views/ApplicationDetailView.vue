<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ApplicationRepository } from '../repositories/ApplicationRepository';
import type { Application, InterviewQuestion, ApplicationStatus } from '../models/types';

const route = useRoute();
const router = useRouter();
const id = route.params.id as string;

const application = ref<Application | null>(null);
const questions = ref<InterviewQuestion[]>([]);
const isLoading = ref(true);
const isEvaluating = ref<string | null>(null);
const isSavingDate = ref(false);
const tempInterviewDate = ref('');

const newQuestion = ref('');
const statusOptions: ApplicationStatus[] = ['saved', 'applied', 'in_review', 'interview', 'in_progress', 'ghosted', 'rejected', 'offered'];

async function loadData() {
  try {
    isLoading.value = true;
    const [appData, questionsData] = await Promise.all([
      ApplicationRepository.getById(id),
      ApplicationRepository.getQuestions(id)
    ]);
    application.value = appData;
    questions.value = questionsData;
    
    if (appData?.interview_at) {
      tempInterviewDate.value = new Date(new Date(appData.interview_at).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    }
  } catch (error) {
    console.error('Failed to load data:', error);
  } finally {
    isLoading.value = false;
  }
}

async function updateStatus(status: ApplicationStatus) {
  if (!application.value) return;
  try {
    const updated = await ApplicationRepository.update(id, { status });
    application.value = updated;
  } catch (error) {
    console.error('Failed to update status:', error);
  }
}

async function saveInterviewDate() {
  if (!application.value) return;
  try {
    isSavingDate.value = true;
    const isoDate = tempInterviewDate.value ? new Date(tempInterviewDate.value).toISOString() : null;
    const updated = await ApplicationRepository.update(id, { interview_at: isoDate });
    application.value = updated;
    // Show a brief success state if desired, but keeping it minimal
  } catch (error) {
    console.error('Failed to update interview date:', error);
    alert('Failed to save date. Please check your connection.');
  } finally {
    isSavingDate.value = false;
  }
}

async function addQuestion() {
  if (!newQuestion.value.trim()) return;
  try {
    const created = await ApplicationRepository.addQuestion({
      application_id: id,
      question: newQuestion.value,
    });
    questions.value.push(created);
    newQuestion.value = '';
  } catch (error) {
    console.error('Failed to add question:', error);
  }
}

async function evaluateAnswer(questionId: string, question: string, answer: string) {
  try {
    isEvaluating.value = questionId;
    const updated = await ApplicationRepository.evaluateQuestion(questionId, question, answer);
    const index = questions.value.findIndex(q => q.id === questionId);
    if (index !== -1) questions.value[index] = updated;
  } catch (error: any) {
    console.error('Failed to evaluate answer:', error);
    alert(`Failed to get feedback: ${error.message || 'Unknown error'}. Check your Supabase logs or API key.`);
  } finally {
    isEvaluating.value = null;
  }
}

async function deleteApplication() {
  if (!confirm('Are you sure you want to delete this application?')) return;
  try {
    await ApplicationRepository.delete(id);
    router.push('/');
  } catch (error) {
    console.error('Failed to delete application:', error);
  }
}

onMounted(loadData);
</script>

<template>
  <div v-if="isLoading" class="text-slate-400 font-light">Loading...</div>
  
  <div v-else-if="application">
    <div class="mb-12">
      <router-link to="/" class="text-xs uppercase tracking-widest text-slate-400 hover:text-slate-800 transition-colors mb-4 inline-block">
        &larr; Back to Dashboard
      </router-link>
      
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-4xl font-light tracking-tight text-slate-800 mb-2">{{ application.company_name }}</h1>
          <p class="text-xl text-slate-400 font-light">{{ application.position }}</p>
        </div>
        
        <div class="flex flex-wrap items-end gap-6">
          <div class="flex flex-col">
            <label class="text-[10px] uppercase tracking-widest text-slate-400 mb-1 font-bold">Status</label>
            <div class="relative">
              <select 
                :value="application.status"
                @change="updateStatus(($event.target as HTMLSelectElement).value as ApplicationStatus)"
                class="bg-white border border-slate-200 rounded-sm pl-3 pr-10 py-2 text-sm focus:outline-none focus:border-slate-800 transition-colors appearance-none cursor-pointer w-full min-w-[140px]"
              >
                <option v-for="status in statusOptions" :key="status" :value="status">
                  {{ status.replace('_', ' ').toUpperCase() }}
                </option>
              </select>
              <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>

          <div class="flex flex-col animate-in fade-in duration-500">
            <label class="text-[10px] uppercase tracking-widest text-slate-400 mb-1 font-bold">Interview Date</label>
            <div class="flex gap-2">
              <input 
                type="datetime-local" 
                v-model="tempInterviewDate"
                class="bg-white border border-slate-200 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-slate-800 transition-colors h-[38px]"
              />
              <button 
                @click="saveInterviewDate"
                :disabled="isSavingDate"
                class="px-3 py-2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-slate-800 transition-colors disabled:opacity-50 h-[38px]"
              >
                {{ isSavingDate ? '...' : 'Save' }}
              </button>
            </div>
          </div>

          <div class="pb-2">
            <button @click="deleteApplication" class="text-slate-300 hover:text-red-400 transition-colors p-1" title="Delete Application">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
      <!-- Left Column: Notes -->
      <div class="md:col-span-1">
        <h2 class="text-xs uppercase tracking-widest text-slate-400 mb-6 font-semibold">Notes</h2>
        <textarea 
          v-model="application.notes"
          @blur="ApplicationRepository.update(id, { notes: application.notes })"
          class="w-full h-64 bg-slate-50 border-none rounded-lg p-4 text-sm focus:outline-none focus:ring-1 focus:ring-slate-200 resize-none"
          placeholder="Add notes about the company, people you met, etc..."
        ></textarea>
      </div>

      <!-- Right Column: Interview Questions -->
      <div class="md:col-span-2">
        <h2 class="text-xs uppercase tracking-widest text-slate-400 mb-6 font-semibold">Interview Questions</h2>
        
        <div class="space-y-8 mb-8">
          <div v-for="q in questions" :key="q.id" class="border-l-2 border-slate-100 pl-6 py-2 group/q">
            <div class="flex justify-between items-start mb-4">
              <input 
                v-model="q.question"
                @blur="ApplicationRepository.updateQuestion(q.id, { question: q.question })"
                class="font-medium text-slate-800 bg-transparent border-none focus:ring-0 p-0 w-full focus:outline-none"
                placeholder="Question text..."
              />
            </div>
            
            <div v-if="!q.llm_feedback" class="space-y-4">
              <textarea 
                v-model="q.user_answer"
                class="w-full border border-slate-100 rounded-md p-3 text-sm focus:outline-none focus:border-slate-300 resize-none"
                placeholder="Write your answer here..."
                rows="3"
              ></textarea>
              <button 
                @click="evaluateAnswer(q.id, q.question, q.user_answer || '')"
                :disabled="isEvaluating === q.id"
                class="px-4 py-2 bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-widest rounded hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                {{ isEvaluating === q.id ? 'Evaluating...' : 'Get Feedback' }}
              </button>
            </div>

            <div v-else class="space-y-4">
              <div class="bg-blue-50/50 p-4 rounded-md">
                <p class="text-xs uppercase tracking-widest text-blue-400 mb-2 font-bold">Feedback</p>
                <p class="text-sm text-slate-700 leading-relaxed">{{ q.llm_feedback }}</p>
              </div>
              <div v-if="q.ideal_answer" class="bg-green-50/50 p-4 rounded-md">
                <p class="text-xs uppercase tracking-widest text-green-400 mb-2 font-bold">Ideal Answer</p>
                <p class="text-sm text-slate-700 leading-relaxed">{{ q.ideal_answer }}</p>
              </div>
              <button 
                @click="q.llm_feedback = undefined; q.ideal_answer = undefined"
                class="text-[10px] uppercase tracking-widest text-slate-300 hover:text-slate-500 font-bold"
              >
                Try again
              </button>
            </div>
          </div>
        </div>

        <div class="pt-6 border-t border-slate-100">
          <label class="block text-xs uppercase tracking-widest text-slate-400 mb-3">Add a question</label>
          <div class="flex gap-2">
            <input 
              v-model="newQuestion"
              @keyup.enter="addQuestion"
              class="flex-1 border-b border-slate-200 focus:border-slate-800 outline-none py-2 text-sm transition-colors"
              placeholder="What were you asked?"
            />
            <button 
              @click="addQuestion"
              class="px-4 py-2 text-slate-400 hover:text-slate-800 transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
