const fs = require('fs');
const path = require('path');
const { DOMParser } = require('@xmldom/xmldom');

const ROOT = path.resolve(__dirname, '..');
const SCRIPTS = __dirname;
const DOCS = path.resolve(__dirname, '../../documentos');

function cleanString(str) {
  if (!str) return '';
  return str.normalize('NFC').replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
}

function removeAccents(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

const subjectManualOverrides = {
  'ELECTIVO HISTORIA/ARTE/RELIGIÓN': 'Electivos',
  'TALLER DEPORTE/RELIGION': 'Taller Deporte - Religión',
  'CONTABILIZACIÓN DE OPERACIONES COMERCIALES': 'Contabilización Operaciones',
  'CONTROL Y PROCESAMIENTO DE INFORMACIÓN CONTABLE': 'Control y Procesamiento',
  'ORGANIZACIÓN Y MÉTODOS DE TRABAJO EN LA OFICINA': 'Organización y Métodos',
  'APLICACIONES INFORMÁTICAS PARA LA GESTIÓN ADMINISTRATIVA': 'Aplicaciones Informáticas',
  'ELABORACIÓN DE INFORMES CONTABLES': 'Elaboración Informes Contables',
  'REGISTRO DE OPERACIONES DE COMERCIO NACIONAL E INTERNACIONAL': 'Registro de Operaciones',
  'EMPRENDIMIENTO Y EMPLEABILIDAD': 'Emprendimiento',
  'UTILIZACIÓN DE INFORMACIÓN CONTABLE': 'Utilización Info Contable',
  'GESTIÓN COMERCIAL Y TRIBUTARIA': 'Gestión Comercial',
  'CÁLCULO DE REMUNERACIÓN, FINIQUITOS Y OBLIGACIONES LABORALES': 'Cálculo de Remuneración',
  'DESARROLLO Y BIENESTAR DEL PERSONAL': 'Desarrollo y Bienestar',
  'PROCESAMIENTO DE INFORMACIÓN CONTABLE - FINANCIERA': 'Procesamiento Info Contable',
  'PIE - PROF DIFRENCIAL': 'Aula de Recursos',
  'DUPLA PSICOSCIAL': 'Dupla Sicosocial'
};

const teacherManualOverrides = {
  'Rafael Beltrán': 'Rafael Beltran',
  'FERNANDA CAVERO': 'Fernanda Cavero Vásquez',
  'Sofía Carvajal': 'Sofía Carvajal Miller',
  'Estefanía Igor': 'Estefanía Igor Bustamante',
  'Sebastián Ayancán': 'Sebastián Ayancan'
};

async function run() {
  console.log('--- GENERADOR DE SQL DE RESTAURACIÓN (ROBUSTO) ---');

  // 1. Load DB Dump
  const dbData = JSON.parse(fs.readFileSync(path.join(SCRIPTS, 'db_dump.json'), 'utf-8'));
  
  const profMap = new Map();
  const profAccentsMap = new Map();
  dbData.professors.forEach(p => {
    const cleaned = cleanString(p.nombre);
    profMap.set(cleaned.toLowerCase(), p.id);
    profAccentsMap.set(removeAccents(cleaned), p.id);
  });
  
  const asigMap = new Map();
  const asigAccentsMap = new Map();
  dbData.subjects.forEach(a => {
    const cleaned = cleanString(a.nombre);
    asigMap.set(cleaned.toLowerCase(), a.id);
    asigAccentsMap.set(removeAccents(cleaned), a.id);
  });

  console.log(`Loaded ${dbData.professors.length} professors and ${dbData.subjects.length} subjects from dump.`);

  // 2. Read and parse XML
  const rawBuffer = fs.readFileSync(path.join(DOCS, 'horarios profe 01-04.xml'));
  const xmlContent = rawBuffer.toString('latin1');
  const doc = new DOMParser().parseFromString(xmlContent, 'text/xml');

  const getElements = (tag) => Array.from(doc.getElementsByTagName(tag));

  const teachers = {};
  getElements('teacher').forEach(el => teachers[el.getAttribute('id')] = el.getAttribute('name'));

  const subjects = {};
  getElements('subject').forEach(el => subjects[el.getAttribute('id')] = el.getAttribute('name'));

  const classes = {};
  getElements('class').forEach(el => classes[el.getAttribute('id')] = el.getAttribute('name'));

  const periods = {};
  getElements('period').forEach(el => {
    periods[el.getAttribute('period')] = {
      starttime: el.getAttribute('starttime'),
      endtime:   el.getAttribute('endtime')
    };
  });

  const lessons = {};
  getElements('lesson').forEach(el => {
    lessons[el.getAttribute('id')] = {
      classids:   el.getAttribute('classids'),
      subjectid:  el.getAttribute('subjectid'),
      teacherids: el.getAttribute('teacherids')
    };
  });

  // 3. Parse records
  const finalRecords = [];
  const missingProfs = new Set();
  const missingAsigs = new Set();

  getElements('card').forEach(el => {
    const lessonid = el.getAttribute('lessonid');
    const period   = el.getAttribute('period');
    const days     = el.getAttribute('days');
    const lesson   = lessons[lessonid];
    if (!lesson) return;

    const teacherIds = (lesson.teacherids || '').split(',').filter(Boolean);
    const classIds = (lesson.classids || '').split(',').filter(Boolean);
    const subjectId = lesson.subjectid;

    for (let i = 0; i < days.length; i++) {
      if (days[i] === '1') {
        const p = periods[period];
        if (!p) continue;

        const courseNames = classIds.map(id => classes[id]).filter(Boolean).sort().join('/');
        const asignaturaName = subjects[subjectId] || null;

        teacherIds.forEach(tId => {
          const profName = teachers[tId];
          if (!profName) return;

          // Búsqueda de Profesor
          let pId = profMap.get(cleanString(profName).toLowerCase());
          if (!pId && teacherManualOverrides[profName]) {
            pId = profMap.get(cleanString(teacherManualOverrides[profName]).toLowerCase());
          }
          if (!pId) {
            pId = profAccentsMap.get(removeAccents(profName));
          }

          // Búsqueda de Asignatura
          let aId = asigMap.get(cleanString(asignaturaName).toLowerCase());
          if (!aId && subjectManualOverrides[asignaturaName]) {
            aId = asigMap.get(cleanString(subjectManualOverrides[asignaturaName]).toLowerCase());
          }
          if (!aId) {
            aId = asigAccentsMap.get(removeAccents(asignaturaName));
          }

          if (!pId) missingProfs.add(profName);
          if (asignaturaName && !aId) missingAsigs.add(asignaturaName);

          if (pId && aId) {
            finalRecords.push({
              profesor_id:   pId,
              asignatura_id: aId,
              curso:         courseNames || null,
              dia_semana:    i + 1,
              hora_inicio:   p.starttime.length === 4 ? `0${p.starttime}:00` : `${p.starttime}:00`,
              hora_fin:      p.endtime.length === 4 ? `0${p.endtime}:00` : `${p.endtime}:00`,
              tipo_bloque:   'clase'
            });
          }
        });
      }
    }
  });

  console.log(`Parsed and mapped ${finalRecords.length} records.`);
  if (missingProfs.size > 0) {
    console.log('Missing professors:', Array.from(missingProfs));
  }
  if (missingAsigs.size > 0) {
    console.log('Missing subjects:', Array.from(missingAsigs));
  }

  // 4. Generate SQL
  let sql = '-- Restauración de Horarios (ROBUSTO)\n';
  sql += 'BEGIN;\n';
  sql += 'DELETE FROM public.horarios;\n';
  
  const batchSize = 100;
  for (let i = 0; i < finalRecords.length; i += batchSize) {
    const batch = finalRecords.slice(i, i + batchSize);
    let insert = 'INSERT INTO public.horarios (profesor_id, asignatura_id, curso, dia_semana, hora_inicio, hora_fin, tipo_bloque)\nVALUES\n';
    insert += batch.map(r => `  ('${r.profesor_id}', '${r.asignatura_id}', ${r.curso ? `'${r.curso.replace(/'/g, "''")}'` : 'NULL'}, ${r.dia_semana}, '${r.hora_inicio}', '${r.hora_fin}', '${r.tipo_bloque}')`).join(',\n') + ';\n';
    sql += insert + '\n';
  }
  
  sql += 'COMMIT;\n';

  fs.writeFileSync(path.join(ROOT, 'final_restore.sql'), sql);
  console.log(`SQL generated: final_restore.sql (${finalRecords.length} inserts)`);
}

run().catch(console.error);
