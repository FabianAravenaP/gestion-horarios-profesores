const fs = require('fs');

const cleaned = JSON.parse(fs.readFileSync('parsed_records_cleaned.json', 'utf8'));
const paulinaId = 'c346be94-a3ff-4bfc-b227-87c4f70fed29';

const subjectMap = {
  'INGLES': '8f46d83d-3960-4b3a-8f35-ae2ce91e76ad',
  'ATENCIÓN APODERADOS': '9e485561-bda2-48a9-90dd-895fcd57c3c5',
  'PIE - PROF DIFRENCIAL': '2a13ce0a-fec1-4ce2-a324-3ac0425d60f8',
  'DUPLA PSICOSCIAL': 'a1b221bf-bed9-4109-9151-d898738abebc',
  'ORIENTACIÓN': '5d30f611-d540-465a-87a5-97735fdbd450'
};

const paulinaRecords = cleaned.records.filter(r => r.profesor_nombre === 'Paulina Beroiza');

let sql = `BEGIN;\n\n`;
sql += `-- Borrar horario actual de Paulina\n`;
sql += `DELETE FROM public.horarios WHERE profesor_id = '${paulinaId}';\n\n`;

const inserts = paulinaRecords.map(r => {
  const asigId = subjectMap[r.asignatura_nombre] || null;
  const cursoVal = r.curso && r.curso !== 'null' ? `'${r.curso}'` : 'NULL';
  
  if (!asigId) {
     console.error('MISSING SUBJECT MAPPING FOR:', r.asignatura_nombre);
     return null;
  }

  return `(
    '${paulinaId}',
    '${asigId}',
    ${r.dia_semana},
    '${r.hora_inicio}',
    '${r.hora_fin}',
    ${cursoVal},
    'clase',
    false
  )`;
}).filter(Boolean);

if (inserts.length > 0) {
  sql += `INSERT INTO public.horarios (profesor_id, asignatura_id, dia_semana, hora_inicio, hora_fin, curso, tipo_bloque, es_disponible_cobertura)\nVALUES\n`;
  sql += inserts.join(',\n') + ';\n\n';
}

sql += `COMMIT;`;

fs.writeFileSync('paulina_update.sql', sql);
console.log(`Generated SQL for Paulina Beroiza with ${inserts.length} records.`);
