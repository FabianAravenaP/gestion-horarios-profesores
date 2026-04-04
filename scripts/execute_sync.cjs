const fs = require('fs');
const path = require('path');
const { DOMParser } = require('@xmldom/xmldom');
const { createClient } = require('@supabase/supabase-js');

const ROOT = path.resolve(__dirname, '..');
const DOCS = path.resolve(__dirname, '../../documentos');

// Load env vars manually
const envFile = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length) envVars[key.trim()] = val.join('=').trim();
});

const SUPABASE_URL = (envVars['VITE_SUPABASE_URL'] || '').replace(/^"|"$/g, '');
const SUPABASE_KEY = (envVars['VITE_SUPABASE_ANON_KEY'] || '').replace(/^"|"$/g, '');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Fix encoding: read as latin1 then re-encode
const rawBuffer = fs.readFileSync(path.join(DOCS, 'horarios profe 01-04.xml'));
const xmlContent = rawBuffer.toString('latin1');

const parser = new DOMParser();
const doc = parser.parseFromString(xmlContent, 'text/xml');

function getElements(tag) {
  return Array.from(doc.getElementsByTagName(tag));
}

// --- Fix special characters (latin1 vs UTF-8) ---
// The file is likely ISO-8859-1. Node's latin1 string is fine for most cases.
function cleanString(str) {
  if (!str) return str;
  return str.trim();
}

// --- Parse dictionaries ---
const xmlTeachers = {};
getElements('teacher').forEach(el => {
  xmlTeachers[el.getAttribute('id')] = cleanString(el.getAttribute('name'));
});

const xmlSubjects = {};
getElements('subject').forEach(el => {
  xmlSubjects[el.getAttribute('id')] = cleanString(el.getAttribute('name'));
});

const xmlClasses = {};
getElements('class').forEach(el => {
  xmlClasses[el.getAttribute('id')] = cleanString(el.getAttribute('name'));
});

const periods = {};
getElements('period').forEach(el => {
  periods[el.getAttribute('period')] = {
    starttime: el.getAttribute('starttime'),
    endtime:   el.getAttribute('endtime')
  };
});

// --- Parse lessons ---
const lessons = {};
getElements('lesson').forEach(el => {
  lessons[el.getAttribute('id')] = {
    classids:   el.getAttribute('classids'),
    subjectid:  el.getAttribute('subjectid'),
    teacherids: el.getAttribute('teacherids')
  };
});

async function run() {
  console.log('--- Starting Sync (01-04-2026) ---');

  // 1. Fetch current entities
  const { data: dbProfs } = await supabase.from('profesores').select('id, nombre');
  const { data: dbAsigs } = await supabase.from('asignaturas').select('id, nombre');

  const profMap = new Map(dbProfs.map(p => [p.nombre.toLowerCase(), p.id]));
  const asigMap = new Map(dbAsigs.map(a => [a.nombre.toLowerCase(), a.id]));

  // 2. Identify missing entities from XML
  const records = [];
  const missingProfs = new Set();
  const missingAsigs = new Set();

  getElements('card').forEach(el => {
    const lessonid = el.getAttribute('lessonid');
    const period   = el.getAttribute('period');
    const days     = el.getAttribute('days');
    const lesson   = lessons[lessonid];
    if (!lesson) return;

    for (let i = 0; i < days.length; i++) {
      if (days[i] === '1') {
        const p = periods[period];
        if (!p) continue;

        const teacherName = xmlTeachers[lesson.teacherids];
        const asigName = xmlSubjects[lesson.subjectid];

        if (teacherName && !profMap.has(teacherName.toLowerCase())) missingProfs.add(teacherName);
        if (asigName && !asigMap.has(asigName.toLowerCase())) missingAsigs.add(asigName);

        records.push({
          profesor_nombre:    teacherName || null,
          asignatura_nombre:  asigName || null,
          curso:              xmlClasses[lesson.classids] || null,
          dia_semana:         i + 1,
          hora_inicio:        p.starttime + ':00',
          hora_fin:           p.endtime + ':00',
          tipo_bloque:        'clase'
        });
      }
    }
  });

  console.log(`Total blocks in XML: ${records.length}`);

  // Filtering out records without mandatory teacher/subject
  const validRecords = records.filter(r => r.profesor_nombre && r.asignatura_nombre);
  console.log(`Valid records for sync: ${validRecords.length}`);

  // Save parsed data to JSON for reference
  fs.writeFileSync('parsed_records_cleaned.json', JSON.stringify({
    records: validRecords,
    missingProfs: [...missingProfs],
    missingAsigs: [...missingAsigs]
  }, null, 2));
  console.log('Parsed data (cleaned) saved to parsed_records_cleaned.json');
}

run();
