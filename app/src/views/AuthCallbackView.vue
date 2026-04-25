<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../lib/supabaseClient';

const router = useRouter();

onMounted(async () => {
  // Supabase SDK sẽ tự động kiểm tra URL, thấy mã 'code', 
  // và thực hiện lệnh POST để đổi lấy Access Token.
  const { error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error exchanging code for session:', error.message);
    router.push('/login');
  } else {
    // Đăng nhập thành công, chuyển về trang chủ. 
    // URL bây giờ sẽ hoàn toàn sạch sẽ.
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
