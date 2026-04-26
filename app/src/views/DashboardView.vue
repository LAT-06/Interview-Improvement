<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { ApplicationRepository } from '../repositories/ApplicationRepository';
import type { Application } from '../models/types';

const applications = ref<Application[]>([]);
const isLoading = ref(true);
const showAddModal = ref(false);

const stats = computed(() => {
  const total = applications.value.length;
  const inProgress = applications.value.filter(app => app.status === 'in_progress').length;
  const rejected = applications.value.filter(app => app.status === 'rejected').length;
  const offers = applications.value.filter(app => app.status === 'offered').length;
  return { total, inProgress, rejected, offers };
});

const newApp = ref({
  company_name: '',
  position: '',
  status: 'applied' as const,
  url: '',
});

async function loadApplications() {
  try {
    isLoading.value = true;
    applications.value = await ApplicationRepository.getAll();
  } catch (error) {
    console.error('Failed to load applications:', error);
  } finally {
    isLoading.value = false;
  }
}

async function addApplication() {
  try {
    const created = await ApplicationRepository.create(newApp.value);
    applications.value = [created, ...applications.value];
    showAddModal.value = false;
    newApp.value = { company_name: '', position: '', status: 'applied', url: '' };
  } catch (error) {
    console.error('Failed to add application:', error);
  }
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    applied: 'bg-slate-100 text-slate-600',
    in_review: 'bg-blue-50 text-blue-600',
    interview: 'bg-purple-50 text-purple-600',
    in_progress: 'bg-indigo-50 text-indigo-600',
    rejected: 'bg-red-50 text-red-600',
    ghosted: 'bg-gray-50 text-gray-400',
    offered: 'bg-green-50 text-green-600',
    saved: 'bg-slate-50 text-slate-400',
  };
  return colors[status] || 'bg-slate-100';
}

onMounted(loadApplications);
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-12">
      <h1 class="text-3xl font-light tracking-tight text-slate-800">Applications</h1>
      <button 
        @click="showAddModal = true"
        class="px-4 py-2 border border-slate-200 hover:border-slate-400 transition-colors text-sm font-medium rounded-sm"
      >
        Add Application
      </button>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
      <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
        <p class="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-1">Total</p>
        <p class="text-3xl font-light text-slate-800">{{ stats.total }}</p>
      </div>
      <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
        <p class="text-[10px] uppercase tracking-[0.2em] text-indigo-500 font-bold mb-1">In Progress</p>
        <p class="text-3xl font-light text-indigo-600">{{ stats.inProgress }}</p>
      </div>
      <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
        <p class="text-[10px] uppercase tracking-[0.2em] text-red-400 font-bold mb-1">Rejected</p>
        <p class="text-3xl font-light text-red-500">{{ stats.rejected }}</p>
      </div>
      <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
        <p class="text-[10px] uppercase tracking-[0.2em] text-green-500 font-bold mb-1">Offers</p>
        <p class="text-3xl font-light text-green-600">{{ stats.offers }}</p>
      </div>
    </div>

    <div v-if="isLoading" class="text-slate-400 font-light">Loading...</div>
    
    <div v-else-if="applications.length === 0" class="text-center py-20 border border-dashed border-slate-200 rounded-2xl bg-white shadow-sm">
      <p class="text-slate-400 font-light">No applications yet. Start by adding one.</p>
    </div>

    <div v-else class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-50 text-slate-400 text-[10px] uppercase tracking-widest font-bold">
              <th class="py-4 px-6">Company</th>
              <th class="py-4 px-6">Position</th>
              <th class="py-4 px-6 text-center">Status</th>
              <th class="py-4 px-6 text-right">Date</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr 
              v-for="app in applications" 
              :key="app.id"
              class="group hover:bg-slate-50/50 transition-colors cursor-pointer"
              @click="$router.push(`/application/${app.id}`)"
            >
              <td class="py-5 px-6 font-medium text-slate-800">{{ app.company_name }}</td>
              <td class="py-5 px-6 text-slate-500 text-sm">{{ app.position }}</td>
              <td class="py-5 px-6 text-center">
                <span :class="['px-2.5 py-1 text-[9px] rounded-full font-bold uppercase tracking-wider', getStatusColor(app.status)]">
                  {{ app.status.replace('_', ' ') }}
                </span>
              </td>
              <td class="py-5 px-6 text-right text-slate-400 text-xs font-mono">
                {{ new Date(app.created_at).toLocaleDateString() }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Minimalist Add Modal -->
    <div v-if="showAddModal" class="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white border border-slate-200 w-full max-w-md p-8 rounded-lg shadow-xl shadow-slate-100">
        <h2 class="text-xl mb-6 font-medium">New Application</h2>
        <form @submit.prevent="addApplication" class="space-y-6">
          <div>
            <label class="block text-xs uppercase tracking-widest text-slate-400 mb-2">Company</label>
            <input 
              v-model="newApp.company_name" 
              required
              class="w-full border-b border-slate-200 focus:border-slate-800 outline-none py-2 transition-colors"
              placeholder="e.g. Google"
            />
          </div>
          <div>
            <label class="block text-xs uppercase tracking-widest text-slate-400 mb-2">Position</label>
            <input 
              v-model="newApp.position" 
              required
              class="w-full border-b border-slate-200 focus:border-slate-800 outline-none py-2 transition-colors"
              placeholder="e.g. Software Engineer"
            />
          </div>
          <div>
            <label class="block text-xs uppercase tracking-widest text-slate-400 mb-2">URL</label>
            <input 
              v-model="newApp.url" 
              class="w-full border-b border-slate-200 focus:border-slate-800 outline-none py-2 transition-colors"
              placeholder="https://..."
            />
          </div>
          <div class="flex justify-end gap-4 pt-4">
            <button 
              type="button" 
              @click="showAddModal = false"
              class="text-sm text-slate-400 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              class="px-6 py-2 bg-slate-900 text-white text-sm font-medium rounded-sm hover:bg-slate-800 transition-colors"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
