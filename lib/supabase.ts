import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Якщо хоч однієї змінної немає, миттєво зупиняємо роботу і підсвічуємо проблему
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    `❌ Supabase Critical Error: Missing environment variables inside .env.local!
     Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set properly.`
  );
}

// Створюємо єдиний чистий екземпляр для всього фронтенду
export const supabase = createClient(supabaseUrl, supabaseAnonKey);