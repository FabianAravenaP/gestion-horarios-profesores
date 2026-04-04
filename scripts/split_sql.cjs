const fs = require('fs');
const path = require('path');

const SQL_FILE = path.join(__dirname, '../final_restore.sql');
const OUTPUT_DIR = __dirname;

const sql = fs.readFileSync(SQL_FILE, 'utf8');
const lines = sql.split('\n').filter(l => !l.startsWith('BEGIN;') && !l.startsWith('COMMIT;') && !l.trim().startsWith('--') && l.trim() !== '');

const chunks = [];
const chunkSize = 200;
for (let i = 0; i < lines.length; i += chunkSize) {
    chunks.push(lines.slice(i, i + chunkSize).join('\n'));
}

chunks.forEach((content, index) => {
    fs.writeFileSync(path.join(OUTPUT_DIR, `restore_chunk_${index + 1}.sql`), content);
    console.log(`Created restore_chunk_${index + 1}.sql`);
});
