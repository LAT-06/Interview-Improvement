// src/lib/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'

class SupabaseService {
  private static instance: SupabaseClient | null = null;

  private constructor() {}

  public static getInstance(): SupabaseClient {
    if (!SupabaseService.instance) {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabasepublishablekey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (!supabaseUrl || !supabasepublishablekey) {
        throw new Error("Missing Supabase environment variables.");
      }

      SupabaseService.instance = createClient(supabaseUrl,supabasepublishablekey);
    }
    return SupabaseService.instance;
  }
}

export const supabase = SupabaseService.getInstance();
