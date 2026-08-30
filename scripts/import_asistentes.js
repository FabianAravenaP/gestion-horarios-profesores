import { createClient } from '@supabase/supabase-js';
import xlsx from 'xlsx';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
let supabaseUrl = '';
let supabaseKey = '';
envFile.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

const workbook = xlsx.readFile('C:/Users/pbero/Documents/app_instituto_comercial/documentos/asiste.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

async function insertAssistants() {
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: 'paulina.admin@icomercialpmt.cl',
    password: 'comercial2026'
  });
  if (loginError) {
    console.error('Failed to login', loginError);
    return;
  }
  
  for (const row of data) {
    if (!row || row.length < 2) continue;
    const nombre = row[0];
    const email = row[1];
    if (!nombre || !email) continue;
    
    console.log(`Inserting ${nombre} - ${email}`);
    
    // Check if already exists
    const { data: existing, error: errCheck } = await supabase
      .from('profesores')
      .select('id')
      .eq('email', email)
      .maybeSingle();
      
    if (existing) {
      console.log(`User ${email} already exists in profesores, updating rol`);
      await supabase.from('profesores').update({ rol: 'asistente' }).eq('id', existing.id);
      continue;
    }
    
    // Insert into profesores
    const { data: newProf, error: insertError } = await supabase
      .from('profesores')
      .insert([{
        nombre: nombre,
        email: email,
        cargo: 'Asistente de la Educación',
        rol: 'asistente',
        horas_excedentes: 0,
        horas_no_lectivas: 0,
        contrato_horas: 44,
        activo: true
      }])
      .select()
      .single();
      
    if (insertError) {
      console.error(`Error inserting ${email}:`, insertError);
      continue;
    }
    
    // Create auth user using admin_reset_password (sets up the user in auth.users)
    const { error: rpcError } = await supabase.rpc('admin_reset_password', {
      target_user_id: newProf.id,
      new_password: 'comercial2026'
    });
    
    if (rpcError) {
      console.error(`Error creating auth user for ${email}:`, rpcError);
    } else {
      console.log(`Successfully created auth user for ${email}`);
    }
  }
  console.log("Done inserting assistants.");
}

insertAssistants();
