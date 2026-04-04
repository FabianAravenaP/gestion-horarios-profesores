const fs = require('fs');

const cleaned = JSON.parse(fs.readFileSync('parsed_records_cleaned.json', 'utf8'));

// Load dynamically from files exported from DB
const dbTeachers = JSON.parse(fs.readFileSync('profesores_db.json', 'utf8'));
const dbSubjects = JSON.parse(fs.readFileSync('asignaturas_db.json', 'utf8'));

function normalize(str) {
  if (!str) return '';
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

// Map XML names to DB IDs
const teacherMap = new Map();
const subjectMap = new Map();

// Helper to find a match
function findMatch(dbList, name) {
  const normName = normalize(name);
  return dbList.find(item => {
    const normItemName = normalize(item.nombre);
    return normItemName.includes(normName) || normName.includes(normItemName);
  });
}

const missingTeachers = new Set();
const missingSubjects = new Set();

const manualSubjectMap = {
  'CONTABILIZACIÓN DE OPERACIONES COMERCIALES': 'd097c447-963d-430f-8c7d-804ec9935a2d',
  'ELABORACIÓN DE INFORMES CONTABLES': 'abdd75a3-3e80-46b6-aea8-05bba8f87e4a',
  'UTILIZACIÓN DE INFORMACIÓN CONTABLE': '89186c74-18dc-44ae-a801-dbc3af79776b',
  'PROCESAMIENTO DE INFORMACIÓN CONTABLE - FINANCIERA': '0ff0b2de-7bc2-4760-812a-cab72a07d160',
  'PIE - PROF DIFRENCIAL': '2a13ce0a-fec1-4ce2-a324-3ac0425d60f8', // Aula de Recursos
  'DUPLA PSICOSCIAL': 'a1b221bf-bed9-4109-9151-d898738abebc' // Dupla Sicosocial
};

cleaned.records.forEach(r => {
  if (!teacherMap.has(r.profesor_nombre)) {
    const match = findMatch(dbTeachers, r.profesor_nombre);
    if (match) teacherMap.set(r.profesor_nombre, match.id);
    else missingTeachers.add(r.profesor_nombre);
  }
  
  if (!subjectMap.has(r.asignatura_nombre)) {
    if (manualSubjectMap[r.asignatura_nombre]) {
      subjectMap.set(r.asignatura_nombre, manualSubjectMap[r.asignatura_nombre]);
    } else {
      const match = findMatch(dbSubjects, r.asignatura_nombre);
      if (match) subjectMap.set(r.asignatura_nombre, match.id);
      else missingSubjects.add(r.asignatura_nombre);
    }
  }
});

if (missingTeachers.size > 0) console.log('Missing Teachers:', Array.from(missingTeachers));
if (missingSubjects.size > 0) console.log('Missing Subjects:', Array.from(missingSubjects));

let sql = `-- Actualización masiva de horarios 01-04-2026\n`;
sql += `BEGIN;\n\n`;

// 1. Limpiar tabla horarios
sql += `DELETE FROM public.horarios;\n\n`;

// 2. Preparar inserts de horarios
const insertValues = [];
cleaned.records.forEach(r => {
  const profId = teacherMap.get(r.profesor_nombre);
  const asigId = subjectMap.get(r.asignatura_nombre);
  
  const cursoVal = r.curso && r.curso !== 'null' ? `'${r.curso}'` : 'NULL';
  
  if (profId && asigId) {
    insertValues.push(`(
      '${profId}',
      '${asigId}',
      ${r.dia_semana},
      '${r.hora_inicio}',
      '${r.hora_fin}',
      ${cursoVal},
      'clase',
      false
    )`);
  }
});

if (insertValues.length > 0) {
  sql += `INSERT INTO public.horarios (profesor_id, asignatura_id, dia_semana, hora_inicio, hora_fin, curso, tipo_bloque, es_disponible_cobertura)\nVALUES\n`;
  sql += insertValues.join(',\n') + ';\n\n';
}

sql += `COMMIT;\n`;

fs.writeFileSync('migration_horarios_final.sql', sql);
console.log(`Generated SQL with ${insertValues.length} records.`);
