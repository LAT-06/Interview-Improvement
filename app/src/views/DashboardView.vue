<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { ApplicationRepository } from '../repositories/ApplicationRepository';
import type { Application } from '../models/types';
import { useRouter } from 'vue-router';

const applications = ref<Application[]>([]);
const isLoading = ref(true);
const showAddModal = ref(false);
const router = useRouter();

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
        class="px-5 py-2.5 bg-[#4D5E3F] text-[#99CD82] hover:bg-[#688055] hover:text-white transition-all text-sm font-bold uppercase tracking-widest rounded-xl shadow-sm hover:shadow-md"
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
        <p class="text-[10px] uppercase tracking-[0.2em] text-[#688055] font-bold mb-1">In Progress</p>
        <p class="text-3xl font-light text-[#688055]">{{ stats.inProgress }}</p>
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

    <div v-if="isLoading" class="text-slate-400 font-light text-center py-20">Loading applications...</div>
    
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
              @click="router.push(`/application/${app.id}`)"
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

    <!-- Modern Add Modal -->
    <div v-if="showAddModal" class="fixed inset-0 bg-[#4D5E3F]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white border border-slate-100 w-full max-w-md p-8 rounded-3xl shadow-2xl">
        <h2 class="text-2xl mb-8 font-light text-[#4D5E3F]">New Application</h2>
        <form @submit.prevent="addApplication" class="space-y-6">
          <div>
            <label class="block text-[10px] uppercase tracking-widest text-slate-400 mb-2 font-bold">Company Name</label>
            <input 
              v-model="newApp.company_name" 
              required
              class="w-full bg-[#F3F4F6] border-none focus:ring-2 focus:ring-[#84A26C] rounded-xl py-3 px-4 transition-all outline-none"
              placeholder="e.g. Google"
            />
          </div>
          <div>
            <label class="block text-[10px] uppercase tracking-widest text-slate-400 mb-2 font-bold">Job Position</label>
            <input 
              v-model="newApp.position" 
              required
              class="w-full bg-[#F3F4F6] border-none focus:ring-2 focus:ring-[#84A26C] rounded-xl py-3 px-4 transition-all outline-none"
              placeholder="e.g. Software Engineer"
            />
          </div>
          <div>
            <label class="block text-[10px] uppercase tracking-widest text-slate-400 mb-2 font-bold">Listing URL</label>
            <input 
              v-model="newApp.url" 
              class="w-full bg-[#F3F4F6] border-none focus:ring-2 focus:ring-[#84A26C] rounded-xl py-3 px-4 transition-all outline-none"
              placeholder="https://..."
            />
          </div>
          <div class="flex justify-end gap-4 pt-6">
            <button 
              type="button" 
              @click="showAddModal = false"
              class="px-6 py-3 text-sm text-slate-400 hover:text-slate-800 transition-colors font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit"
              class="px-8 py-3 bg-[#4D5E3F] text-[#99CD82] text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-[#688055] hover:text-white transition-all shadow-lg"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
