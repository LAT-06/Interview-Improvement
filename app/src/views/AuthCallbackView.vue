<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../lib/supabaseClient';

const router = useRouter();

onMounted(async () => {
  // Supabase SDK will automatically check the URL, detect the 'code',
  // and perform a POST request to exchange it for an Access Token.
  const { error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error exchanging code for session:', error.message);
    router.push('/login');
  } else {
    // Login successful, redirect to home page.
    // The URL will now be completely clean.
    router.push('/');
  }
});
</script>

<template>
  <div class="flex items-center justify-center min-h-[60vh]">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
      <p class="text-slate-500">Completing login...</p>
    </div>
  </div>
</template>
