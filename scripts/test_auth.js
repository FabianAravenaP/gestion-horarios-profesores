import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
let supabaseUrl = '';
let supabaseKey = '';
envFile.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'paulina.admin@icomercialpmt.cl',
    password: 'comercial2026'
  });
  if (error) {
    console.error('Failed to login', error);
  } else {
    console.log('Login successful', data.session.access_token);
  }
}

testAuth();
