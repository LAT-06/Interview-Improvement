<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RouterView, useRouter } from 'vue-router';
import { supabase } from './lib/supabaseClient';

const router = useRouter();
const user = ref<any>(null);
const isMobileMenuOpen = ref(false);

async function handleLogout() {
  await supabase.auth.signOut();
  router.push('/login');
}

// Close menu on page change
router.afterEach(() => {
  isMobileMenuOpen.value = false;
});

onMounted(() => {
  // Check current session
  supabase.auth.getSession().then(({ data: { session } }) => {
    user.value = session?.user ?? null;
  });

  // Listen for changes
  supabase.auth.onAuthStateChange((_event, session) => {
    user.value = session?.user ?? null;
  });
});
</script>

<template>
  <div class="min-h-screen bg-white text-slate-900 font-sans antialiased">
    <header v-if="user" class="border-b border-slate-100 py-6 px-4 md:px-8 relative bg-white z-50">
      <div class="max-w-5xl mx-auto flex justify-between items-center">
        <div class="flex gap-8 items-center">
          <router-link to="/" class="text-xl font-medium tracking-tight">
            Job Tracker
          </router-link>
          
          <!-- Desktop Navigation -->
          <nav class="hidden md:flex gap-6">
            <router-link to="/questions" class="text-sm text-slate-400 hover:text-slate-900 transition-colors mt-1">
              Question Bank
            </router-link>
            <router-link to="/calendar" class="text-sm text-slate-400 hover:text-slate-900 transition-colors mt-1">
              Calendar
            </router-link>
            <router-link to="/mock-interview" class="text-sm text-slate-400 hover:text-slate-900 transition-colors mt-1">
              Mock Interview
            </router-link>
            <router-link to="/community" class="text-sm text-slate-400 hover:text-slate-900 transition-colors mt-1">
              Community
            </router-link>
          </nav>
        </div>

        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2 pr-4 border-r border-slate-100 hidden sm:flex">
            <img 
              v-if="user.user_metadata.avatar_url" 
              :src="user.user_metadata.avatar_url" 
              class="w-8 h-8 rounded-full border border-slate-100"
            />
            <span class="text-xs font-medium text-slate-500">
              {{ user.user_metadata.full_name || user.email }}
            </span>
          </div>
          
          <button 
            @click="handleLogout"
            class="hidden sm:block text-xs uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors font-bold"
          >
            Logout
          </button>

          <!-- Mobile Menu Button -->
          <button 
            @click="isMobileMenuOpen = !isMobileMenuOpen"
            class="md:hidden p-2 text-slate-500 hover:text-slate-900"
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
        <div v-if="isMobileMenuOpen" class="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-100 shadow-xl p-4 space-y-4">
          <router-link to="/questions" class="block text-slate-600 font-medium">Question Bank</router-link>
          <router-link to="/calendar" class="block text-slate-600 font-medium">Calendar</router-link>
          <router-link to="/mock-interview" class="block text-slate-600 font-medium">Mock Interview</router-link>
          <router-link to="/community" class="block text-slate-600 font-medium">Community</router-link>
          <div class="pt-4 border-t border-slate-50 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <img 
                v-if="user.user_metadata.avatar_url" 
                :src="user.user_metadata.avatar_url" 
                class="w-8 h-8 rounded-full"
              />
              <span class="text-sm font-medium text-slate-500">{{ user.user_metadata.full_name || user.email }}</span>
            </div>
            <button @click="handleLogout" class="text-xs font-bold uppercase text-red-400">Logout</button>
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
  background-color: white;
}
</style>
