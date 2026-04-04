const fs = require('fs');
const path = require('path');

const SQL_FILE = path.resolve(__dirname, '../final_restore.sql');
const OUTPUT_DIR = __dirname;

const sql = fs.readFileSync(SQL_FILE, 'utf8');
const lines = sql.split('\n').map(l => l.trim()).filter(l => l.startsWith('('));

console.log(`Extracted ${lines.length} insert lines.`);

const chunkSize = 50;
for (let i = 0; i < lines.length; i += chunkSize) {
    let chunk = lines.slice(i, i + chunkSize);
    let chunkText = chunk.join('\n');
    
    // Replace trailing comma with semicolon
    if (chunkText.endsWith(',')) {
        chunkText = chunkText.slice(0, -1) + ';';
    } else if (!chunkText.endsWith(';')) {
        chunkText += ';';
    }

    const content = `INSERT INTO public.horarios (profesor_id, asignatura_id, curso, dia_semana, hora_inicio, hora_fin, tipo_bloque) VALUES\n${chunkText}`;
    
    fs.writeFileSync(path.join(OUTPUT_DIR, `chunk_${Math.floor(i / chunkSize) + 1}.sql`), content);
}
console.log('Successfully created all tiny chunks.');
