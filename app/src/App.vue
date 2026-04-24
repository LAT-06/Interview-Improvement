<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>

<template>
  <div class="min-h-screen bg-white text-slate-900 font-sans antialiased">
    <header class="border-b border-slate-100 py-6 px-4 md:px-8">
      <div class="max-w-5xl mx-auto flex justify-between items-center">
        <div class="flex gap-8 items-center">
          <router-link to="/" class="text-xl font-medium tracking-tight">
            Euphoria
          </router-link>
          <router-link to="/questions" class="text-sm text-slate-400 hover:text-slate-900 transition-colors mt-1">
            Question Bank
          </router-link>
          <router-link to="/calendar" class="text-sm text-slate-400 hover:text-slate-900 transition-colors mt-1">
            Calendar
          </router-link>
          <router-link to="/mock-interview" class="text-sm text-slate-400 hover:text-slate-900 transition-colors mt-1">
            Mock Interview
          </router-link>
        </div>
      </div>
    </header>

    <main class="max-w-5xl mx-auto py-12 px-4 md:px-8">
      <RouterView />
    </main>
  </div>
</template>

<style>
/* Any global styles if needed, though Tailwind covers most */
body {
  background-color: white;
}
</style>
