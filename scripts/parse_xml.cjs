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

// --- Parse dictionaries ---
const teachers = {};
getElements('teacher').forEach(el => {
  const id = el.getAttribute('id');
  const name = el.getAttribute('name');
  teachers[id] = name;
});

const subjects = {};
getElements('subject').forEach(el => {
  const id = el.getAttribute('id');
  const name = el.getAttribute('name');
  subjects[id] = name;
});

const classes = {};
getElements('class').forEach(el => {
  classes[el.getAttribute('id')] = el.getAttribute('name');
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
  const id = el.getAttribute('id');
  lessons[id] = {
    classids:   el.getAttribute('classids'),
    subjectid:  el.getAttribute('subjectid'),
    teacherids: el.getAttribute('teacherids')
  };
});

// --- Parse cards ---
const records = [];
getElements('card').forEach(el => {
  const lessonid = el.getAttribute('lessonid');
  const period   = el.getAttribute('period');
  const days     = el.getAttribute('days');
  const lesson   = lessons[lessonid];
  if (!lesson) return;

  // Handle multiple teacher/class IDs (comma separated)
  const teacherIds = (lesson.teacherids || '').split(',').filter(Boolean);
  const classIds = (lesson.classids || '').split(',').filter(Boolean);
  const subjectId = lesson.subjectid;

  for (let i = 0; i < days.length; i++) {
    if (days[i] === '1') {
      const p = periods[period];
      if (!p) continue;

      // Extract course names and join with slash if multiple
      const courseNames = classIds.map(id => classes[id]).filter(Boolean).join('/');
      const asignaturaName = subjects[subjectId] || null;

      // Create one record per teacher to ensure all teachers have their schedule
      teacherIds.forEach(tId => {
        records.push({
          profesor_nombre:    teachers[tId] || null,
          asignatura_nombre:  asignaturaName,
          curso:              courseNames || null,
          dia_semana:         i + 1,
          hora_inicio:        p.starttime + ':00',
          hora_fin:           p.endtime + ':00',
          tipo_bloque:        'clase'
        });
      });
    }
  }
});

console.log('Total records parsed:', records.length);

// Show sample with fixed encoding
const sampleTeachers = [...new Set(records.map(r => r.profesor_nombre).filter(Boolean))].sort().slice(0, 5);
const sampleSubjects = [...new Set(records.map(r => r.asignatura_nombre).filter(Boolean))].sort().slice(0, 5);
console.log('Sample teachers (fixed):', sampleTeachers);
console.log('Sample subjects (fixed):', sampleSubjects);

fs.writeFileSync('parsed_schedule_fixed.json', JSON.stringify(records, null, 2));
console.log('Saved to parsed_schedule_fixed.json');
