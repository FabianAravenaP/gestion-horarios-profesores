const fs = require('fs');
const path = require('path');

const SQL_FILE = path.resolve(__dirname, '../final_restore.sql');
const OUTPUT_DIR = __dirname;

const sql = fs.readFileSync(SQL_FILE, 'utf8');
const lines = sql.split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('('))
    .map(l => l.endsWith(',') ? l.slice(0, -1) : l); // remove trailing comma

console.log(`Extracted ${lines.length} lines.`);

const chunkSize = 50;
for (let i = 0; i < lines.length; i += chunkSize) {
    const chunk = lines.slice(i, i + chunkSize);
    const chunkText = chunk.join(',\n') + ';';
    const content = `INSERT INTO public.horarios (profesor_id, asignatura_id, curso, dia_semana, hora_inicio, hora_fin, tipo_bloque) VALUES\n${chunkText}`;
    fs.writeFileSync(path.join(OUTPUT_DIR, `chunk_${Math.floor(i / chunkSize) + 1}.sql`), content);
}
console.log('Cleanup Done.');
