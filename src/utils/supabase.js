import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://jtwftedekfnukstngpto.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0d2Z0ZWRla2ZudWtzdG5ncHRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMjE1NDYsImV4cCI6MjA3OTY5NzU0Nn0.pFzcCjVuB_3s5OZdp3Inw8wfNAOUAjK6YiO0VipMxS0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
