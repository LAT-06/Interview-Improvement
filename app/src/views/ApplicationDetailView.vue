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
    const data = await ApplicationRepository.getById(id);
    application.value = data;
    // Backend returns questions as interview_questions relation
    questions.value = data.interview_questions || [];
    
    if (data?.interview_at) {
      tempInterviewDate.value = new Date(new Date(data.interview_at).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
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
  if (!answer.trim()) {
    alert('Please enter an answer first.');
    return;
  }
  
  try {
    isEvaluating.value = questionId;
    const updated = await ApplicationRepository.evaluateQuestion(questionId, question, answer);
    
    // Tìm và cập nhật câu hỏi trong danh sách local
    const index = questions.value.findIndex(q => q.id === questionId);
    if (index !== -1) {
      questions.value[index] = {
        ...questions.value[index],
        ...updated
      };
    }
  } catch (error: any) {
    console.error('Failed to evaluate answer:', error);
    alert('Failed to get feedback from AI. Please try again.');
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
      <router-link to="/" class="text-xs uppercase tracking-widest text-slate-400 hover:text-slate-800 transition-colors mb-6 inline-block">
        &larr; Back to Dashboard
      </router-link>
      
      <div class="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-8">
        <div class="flex-1">
          <h1 class="text-3xl md:text-4xl font-light tracking-tight text-slate-800 mb-2">{{ application.company_name }}</h1>
          <p class="text-lg md:text-xl text-slate-400 font-light">{{ application.position }}</p>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row items-end gap-4 md:gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div class="flex flex-col w-full min-w-[140px]">
            <label class="text-[10px] uppercase tracking-widest text-slate-400 mb-1.5 font-bold">Status</label>
            <div class="relative">
              <select 
                :value="application.status"
                @change="updateStatus(($event.target as HTMLSelectElement).value as ApplicationStatus)"
                class="bg-slate-50 border border-slate-100 rounded-xl pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all appearance-none cursor-pointer w-full"
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

          <div class="flex flex-col w-full">
            <label class="text-[10px] uppercase tracking-widest text-slate-400 mb-1.5 font-bold">Interview Date</label>
            <div class="flex gap-2">
              <input 
                type="datetime-local" 
                v-model="tempInterviewDate"
                class="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all"
              />
              <button 
                @click="saveInterviewDate"
                :disabled="isSavingDate"
                class="px-4 py-2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {{ isSavingDate ? '...' : 'Save' }}
              </button>
            </div>
          </div>

          <div class="flex items-center lg:pb-2 pt-2 sm:pt-0">
            <button @click="deleteApplication" class="flex items-center gap-2 text-slate-300 hover:text-red-400 transition-colors text-xs font-bold uppercase tracking-widest" title="Delete Application">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              <span class="lg:hidden">Delete Application</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <!-- Left Column: Notes -->
      <div class="md:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
        <h2 class="text-xs uppercase tracking-widest text-slate-400 mb-6 font-semibold">Notes</h2>
        <textarea 
          v-model="application.notes"
          @blur="ApplicationRepository.update(id, { notes: application.notes })"
          class="w-full h-64 bg-slate-50 border-none rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-100 resize-none transition-all"
          placeholder="Add notes about the company..."
        ></textarea>
      </div>

      <!-- Right Column: Interview Questions -->
      <div class="md:col-span-2 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
        <h2 class="text-xs uppercase tracking-widest text-slate-400 mb-8 font-semibold">Interview Questions</h2>
        
        <div class="space-y-10 mb-10">
          <div v-for="q in questions" :key="q.id" class="relative group/q">
            <div class="flex justify-between items-start mb-4">
              <input 
                v-model="q.question"
                @blur="ApplicationRepository.updateQuestion(q.id, { question: q.question })"
                class="font-medium text-slate-800 bg-transparent border-none focus:ring-0 p-0 w-full focus:outline-none text-lg"
                placeholder="Question text..."
              />
              <button 
                @click="q.is_public = !q.is_public; ApplicationRepository.updateQuestion(q.id, { is_public: q.is_public })"
                :class="['text-[9px] uppercase tracking-widest font-bold transition-all px-2 py-1 rounded-md ml-4 whitespace-nowrap border', 
                         q.is_public ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-300 border-slate-100 hover:border-slate-800 hover:text-slate-800']"
              >
                {{ q.is_public ? 'Shared' : 'Private' }}
              </button>
            </div>
            
            <div v-if="!q.llm_feedback" class="space-y-4">
              <textarea 
                v-model="q.user_answer"
                class="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-100 resize-none transition-all"
                placeholder="Write your answer here..."
                rows="3"
              ></textarea>
              <button 
                @click="evaluateAnswer(q.id, q.question, q.user_answer || '')"
                :disabled="isEvaluating === q.id"
                class="px-4 py-2 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                {{ isEvaluating === q.id ? 'Evaluating...' : 'Get Feedback' }}
              </button>
            </div>

            <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <p class="text-[10px] uppercase tracking-widest text-slate-400 mb-3 font-bold">Feedback</p>
                <p class="text-sm text-slate-700 leading-relaxed">{{ q.llm_feedback }}</p>
                <button 
                  @click="q.llm_feedback = undefined; q.ideal_answer = undefined"
                  class="mt-4 text-[9px] uppercase tracking-widest text-slate-400 hover:text-slate-800 font-bold underline decoration-slate-200 underline-offset-4"
                >
                  Edit Answer
                </button>
              </div>
              <div v-if="q.ideal_answer" class="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                <p class="text-[10px] uppercase tracking-widest text-emerald-600 mb-3 font-bold">Ideal Answer</p>
                <p class="text-sm text-emerald-900 leading-relaxed">{{ q.ideal_answer }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-8 border-t border-slate-50">
          <label class="block text-[10px] uppercase tracking-widest text-slate-400 mb-4 font-bold">Add a question</label>
          <div class="flex gap-3">
            <input 
              v-model="newQuestion"
              @keyup.enter="addQuestion"
              class="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all"
              placeholder="What were you asked?"
            />
            <transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <button 
                v-if="newQuestion.trim()"
                @click="addQuestion"
                class="px-6 py-3 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all"
              >
                Add
              </button>
            </transition>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
