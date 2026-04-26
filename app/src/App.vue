<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RouterView, useRouter } from 'vue-router';
import api from './lib/apiClient';

const router = useRouter();
const user = ref<any>(null);
const isMobileMenuOpen = ref(false);
const isProfileDropdownOpen = ref(false);

async function handleLogout() {
  await api.post('/auth/logout');
  user.value = null;
  isProfileDropdownOpen.value = false;
  router.push('/login');
}

// Close menus on page change
router.afterEach(() => {
  isMobileMenuOpen.value = false;
  isProfileDropdownOpen.value = false;
});

onMounted(async () => {
  try {
    const { data } = await api.get('/auth/me');
    user.value = data.user;
  } catch (error) {
    user.value = null;
  }
});
</script>

<template>
  <div class="min-h-screen bg-[#F3F4F6] text-slate-900 font-sans antialiased">
    <header v-if="user" class="bg-[#4D5E3F] py-4 px-4 md:px-8 relative z-50 shadow-lg">
      <div class="max-w-5xl mx-auto flex justify-between items-center">
        <div class="flex gap-10 items-center">
          <router-link to="/" class="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <img src="/Flag.png" alt="ITea Logo" class="w-10 h-10 object-contain" />
            ITea Jobs
          </router-link>
          
          <!-- Desktop Navigation -->
          <nav class="hidden md:flex gap-1 items-center">
            <router-link 
              v-for="link in [
                { to: '/questions', label: 'Question Bank' },
                { to: '/calendar', label: 'Calendar' },
                { to: '/mock-interview', label: 'Mock Interview' },
                { to: '/community', label: 'Community' }
              ]" 
              :key="link.to"
              :to="link.to" 
              class="text-sm font-medium px-4 py-2 rounded-xl transition-all text-white"
              :class="[
                $route.path === link.to 
                  ? 'bg-[#688055] shadow-inner' 
                  : 'hover:bg-[#84A26C]'
              ]"
            >
              {{ link.label }}
            </router-link>
          </nav>
        </div>

        <div class="flex items-center gap-4">
          <!-- Profile Dropdown -->
          <div class="relative hidden sm:block">
            <button 
              @click="isProfileDropdownOpen = !isProfileDropdownOpen"
              class="flex items-center gap-3 px-3 py-1.5 bg-[#688055] rounded-2xl border border-[#84A26C]/30 shadow-sm hover:bg-[#84A26C] transition-all"
            >
              <img 
                v-if="user.user_metadata.avatar_url" 
                :src="user.user_metadata.avatar_url" 
                class="w-7 h-7 rounded-full border border-[#99CD82]/50"
              />
              <span class="text-xs font-semibold text-white">
                {{ user.user_metadata.full_name || user.email }}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-[#99CD82] transition-transform" :class="{'rotate-180': isProfileDropdownOpen}"><path d="m6 9 6 6 6-6"/></svg>
            </button>

            <!-- Dropdown Menu -->
            <transition
              enter-active-class="transition duration-100 ease-out"
              enter-from-class="opacity-0 scale-95 translate-y-1"
              enter-to-class="opacity-100 scale-100 translate-y-0"
              leave-active-class="transition duration-75 ease-in"
              leave-from-class="opacity-100 scale-100 translate-y-0"
              leave-to-class="opacity-0 scale-95 translate-y-1"
            >
              <div v-if="isProfileDropdownOpen" class="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-[60]">
                <div class="px-4 py-2 border-b border-slate-50 mb-1">
                  <p class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Account</p>
                  <p class="text-xs font-medium text-slate-700 truncate">{{ user.email }}</p>
                </div>
                <button 
                  @click="handleLogout"
                  class="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2 font-medium"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Logout
                </button>
              </div>
            </transition>
          </div>

          <!-- Mobile Menu Button -->
          <button 
            @click="isMobileMenuOpen = !isMobileMenuOpen"
            class="md:hidden p-2 text-[#99CD82] hover:text-white"
          >
            <svg v-if="!isMobileMenuOpen" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Dropdown Navigation -->
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div v-if="isMobileMenuOpen" class="md:hidden absolute top-full left-0 right-0 bg-[#4D5E3F] border-t border-[#688055] shadow-2xl p-4 space-y-2">
          <router-link 
            v-for="link in [
              { to: '/questions', label: 'Question Bank' },
              { to: '/calendar', label: 'Calendar' },
              { to: '/mock-interview', label: 'Mock Interview' },
              { to: '/community', label: 'Community' }
            ]" 
            :key="link.to"
            :to="link.to" 
            class="block px-4 py-3 rounded-xl text-[#99CD82] font-medium hover:bg-[#84A26C] hover:text-white transition-all"
          >
            {{ link.label }}
          </router-link>
          <div class="pt-4 mt-2 border-t border-[#688055] flex items-center justify-between">
            <div class="flex items-center gap-2">
              <img 
                v-if="user.user_metadata.avatar_url" 
                :src="user.user_metadata.avatar_url" 
                class="w-8 h-8 rounded-full"
              />
              <span class="text-sm font-medium text-white">{{ user.user_metadata.full_name || user.email }}</span>
            </div>
            <button @click="handleLogout" class="text-xs font-bold uppercase text-red-300">Logout</button>
          </div>
        </div>
      </transition>
    </header>

    <main class="max-w-5xl mx-auto py-12 px-4 md:px-8">
      <RouterView />
    </main>
  </div>
</template>

<style>
body {
  background-color: #F3F4F6;
}
</style>
