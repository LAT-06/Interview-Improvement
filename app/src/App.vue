<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RouterView, useRouter } from 'vue-router';
import { supabase } from './lib/supabaseClient';

const router = useRouter();
const user = ref<any>(null);

async function handleLogout() {
  await supabase.auth.signOut();
  router.push('/login');
}

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
    <header v-if="user" class="border-b border-slate-100 py-6 px-4 md:px-8">
      <div class="max-w-5xl mx-auto flex justify-between items-center">
        <div class="flex gap-8 items-center">
          <router-link to="/" class="text-xl font-medium tracking-tight">
            Job Tracker
          </router-link>
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
          <div class="flex items-center gap-2 pr-4 border-r border-slate-100">
            <img 
              v-if="user.user_metadata.avatar_url" 
              :src="user.user_metadata.avatar_url" 
              class="w-8 h-8 rounded-full border border-slate-100"
            />
            <span class="text-xs font-medium text-slate-500 hidden sm:inline">
              {{ user.user_metadata.full_name || user.email }}
            </span>
          </div>
          <button 
            @click="handleLogout"
            class="text-xs uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors font-bold"
          >
            Logout
          </button>
        </div>
      </div>
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
