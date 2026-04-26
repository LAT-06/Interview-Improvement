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

      <div class="space-y-8 bg-white p-8 border border-slate-100 rounded-3xl shadow-sm">
        <div>
          <label class="block text-[10px] uppercase tracking-widest text-slate-400 mb-3 font-bold">Target Role</label>
          <input 
            v-model="role"
            class="w-full bg-[#F3F4F6] border-none focus:ring-2 focus:ring-[#84A26C] rounded-xl py-3 px-4 transition-all outline-none"
            placeholder="e.g. Senior Frontend Engineer"
          />
        </div>
        
        <div>
          <label class="block text-[10px] uppercase tracking-widest text-slate-400 mb-3 font-bold">Job Description / Requirements (Optional)</label>
          <textarea 
            v-model="jd"
            class="w-full h-48 bg-[#F3F4F6] border-none rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#84A26C] resize-none transition-all"
            placeholder="Paste the job description here to make the interview more specific..."
          ></textarea>
        </div>

        <button 
          @click="startInterview"
          :disabled="!role"
          class="w-full py-4 bg-[#4D5E3F] text-[#99CD82] text-sm font-bold uppercase tracking-widest rounded-xl hover:bg-[#688055] hover:text-white transition-all disabled:opacity-50 shadow-lg"
        >
          Start Mock Interview
        </button>
      </div>
    </div>

    <!-- Chat Phase -->
    <div v-else class="flex flex-col h-[75vh]">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h2 class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Mock Interview</h2>
          <p class="text-lg font-medium text-slate-800">{{ role }}</p>
        </div>
        <button @click="reset" class="text-xs uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors font-bold">
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
              'max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm',
              msg.role === 'user' 
                ? 'bg-[#4D5E3F] text-white' 
                : 'bg-white text-slate-700 border border-slate-100'
            ]"
          >
            <p class="whitespace-pre-wrap">{{ msg.content }}</p>
          </div>
        </div>
        
        <div v-if="isProcessing" class="flex justify-start">
          <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div class="flex gap-1">
              <span class="w-1.5 h-1.5 bg-[#84A26C] rounded-full animate-bounce"></span>
              <span class="w-1.5 h-1.5 bg-[#84A26C] rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span class="w-1.5 h-1.5 bg-[#84A26C] rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        </div>
      </div>

      <div class="relative">
        <textarea 
          v-model="userMessage"
          @keydown.enter.prevent="sendMessage"
          class="w-full border border-slate-100 bg-white rounded-2xl p-4 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-[#84A26C] transition-all resize-none shadow-sm"
          placeholder="Type your answer here... (Enter to send)"
          rows="3"
        ></textarea>
        <button 
          @click="sendMessage"
          :disabled="!userMessage.trim() || isProcessing"
          class="absolute right-3 bottom-3 p-3 bg-[#4D5E3F] text-[#99CD82] rounded-xl hover:bg-[#688055] hover:text-white transition-all disabled:opacity-50 shadow-md flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
