<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { ApplicationRepository } from '../repositories/ApplicationRepository';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const step = ref<'config' | 'chat'>('config');
const role = ref('');
const jd = ref('');
const messages = ref<Message[]>([]);
const userMessage = ref('');
const isProcessing = ref(false);
const chatContainer = ref<HTMLElement | null>(null);

async function startInterview() {
  if (!role.value.trim()) return;
  step.value = 'chat';
  isProcessing.value = true;
  
  try {
    // Get past questions context
    const pastQuestions = await ApplicationRepository.getAllQuestions();
    const bankContext = pastQuestions.map(q => q.question).join('\n');
    
    const initialContent = await ApplicationRepository.mockInterview(
      role.value,
      jd.value,
      [],
      bankContext
    );
    
    messages.value.push({ role: 'assistant', content: initialContent });
  } catch (error) {
    console.error('Failed to start interview:', error);
    alert('Failed to start interview. Check connection or Edge Function deployment.');
  } finally {
    isProcessing.value = false;
  }
}

async function sendMessage() {
  if (!userMessage.value.trim() || isProcessing.value) return;
  
  const content = userMessage.value;
  userMessage.value = '';
  messages.value.push({ role: 'user', content });
  
  isProcessing.value = true;
  scrollToBottom();

  try {
    const pastQuestions = await ApplicationRepository.getAllQuestions();
    const bankContext = pastQuestions.map(q => q.question).join('\n');

    const nextContent = await ApplicationRepository.mockInterview(
      role.value,
      jd.value,
      messages.value,
      bankContext
    );
    
    messages.value.push({ role: 'assistant', content: nextContent });
    scrollToBottom();
  } catch (error) {
    console.error('Failed to send message:', error);
  } finally {
    isProcessing.value = false;
  }
}

async function scrollToBottom() {
  await nextTick();
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
}

function reset() {
  if (confirm('Are you sure you want to end this interview?')) {
    step.value = 'config';
    messages.value = [];
    role.value = '';
    jd.value = '';
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <!-- Config Phase -->
    <div v-if="step === 'config'" class="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h1 class="text-3xl font-light tracking-tight text-slate-800 mb-2">Mock Interview</h1>
      <p class="text-slate-400 mb-12 font-light">Set the stage for your practice session.</p>

      <div class="space-y-8 bg-white p-8 border border-slate-100 rounded-lg shadow-sm">
        <div>
          <label class="block text-xs uppercase tracking-widest text-slate-400 mb-3 font-bold">Target Role</label>
          <input 
            v-model="role"
            class="w-full border-b border-slate-200 focus:border-slate-800 outline-none py-2 transition-colors text-lg"
            placeholder="e.g. Senior Frontend Engineer"
          />
        </div>
        
        <div>
          <label class="block text-xs uppercase tracking-widest text-slate-400 mb-3 font-bold">Job Description / Requirements (Optional)</label>
          <textarea 
            v-model="jd"
            class="w-full h-48 bg-slate-50 border-none rounded-lg p-4 text-sm focus:outline-none focus:ring-1 focus:ring-slate-200 resize-none"
            placeholder="Paste the job description here to make the interview more specific..."
          ></textarea>
        </div>

        <button 
          @click="startInterview"
          :disabled="!role"
          class="w-full py-4 bg-slate-900 text-white text-sm font-bold uppercase tracking-widest rounded hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          Start Mock Interview
        </button>
      </div>
    </div>

    <!-- Chat Phase -->
    <div v-else class="flex flex-col h-[75vh]">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-sm font-bold uppercase tracking-widest text-slate-400">Mock Interview</h2>
          <p class="text-lg font-medium text-slate-800">{{ role }}</p>
        </div>
        <button @click="reset" class="text-xs uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors">
          End Session
        </button>
      </div>

      <div 
        ref="chatContainer"
        class="flex-1 overflow-y-auto space-y-6 pr-4 mb-6 scroll-smooth"
      >
        <div 
          v-for="(msg, idx) in messages" 
          :key="idx"
          :class="['flex', msg.role === 'user' ? 'justify-end' : 'justify-start']"
        >
          <div 
            :class="[
              'max-w-[85%] p-4 rounded-lg text-sm leading-relaxed',
              msg.role === 'user' 
                ? 'bg-slate-900 text-white' 
                : 'bg-slate-50 text-slate-700 border border-slate-100'
            ]"
          >
            <p class="whitespace-pre-wrap">{{ msg.content }}</p>
          </div>
        </div>
        
        <div v-if="isProcessing" class="flex justify-start">
          <div class="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div class="flex gap-1">
              <span class="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
              <span class="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span class="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        </div>
      </div>

      <div class="relative">
        <textarea 
          v-model="userMessage"
          @keydown.enter.prevent="sendMessage"
          class="w-full border border-slate-200 rounded-lg p-4 pr-24 text-sm focus:outline-none focus:border-slate-800 transition-colors resize-none shadow-sm"
          placeholder="Type your answer here... (Enter to send)"
          rows="3"
        ></textarea>
        <button 
          @click="sendMessage"
          :disabled="!userMessage.trim() || isProcessing"
          class="absolute right-3 bottom-3 px-4 py-2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  </div>
</template>
