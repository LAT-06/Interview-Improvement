<script setup lang="ts">
import { supabase } from '../lib/supabaseClient';

async function loginWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });
  
  if (error) {
    console.error('Login error:', error.message);
    alert('Failed to login with Google');
  }
}
</script>

<template>
  <div class="min-h-[60vh] flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div class="text-center mb-12">
      <h1 class="text-4xl font-light tracking-tight text-slate-800 mb-4">Job Tracker</h1>
      <p class="text-slate-400 font-light">Sign in to manage your applications and practice interviews.</p>
    </div>

    <button 
      @click="loginWithGoogle"
      class="flex items-center gap-3 px-8 py-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm hover:shadow-md group"
    >
      <svg class="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
      </svg>
      <span class="text-sm font-medium text-slate-700">Continue with Google</span>
    </button>
  </div>
</template>
