
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ixfwvaszmngbyxrdiaha.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4Znd2YXN6bW5nYnl4cmRpYWhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MzM1NTUsImV4cCI6MjA5MDQwOTU1NX0.wh_VbGcfMcl-lXmdbObpY6ifGwzuVEdOGsjCQuHFxkY";

async function test() {
  const supabase = createClient(SUPABASE_URL, KEY);
  const { data, error } = await supabase.from('organizations').select('count', { count: 'exact', head: true });
  console.log({ data, error });
}

test();
