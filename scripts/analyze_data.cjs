const migration = require('../manual_migration.json').Sheet1;
const actualizado = require('../horario_actualizado.json').Sheet1;

const migProfs = new Set(migration.map(r => r.Profesor));
const actProfs = new Set(actualizado.map(r => r.Profesor));

console.log('--- Manual Migration ---');
console.log('Total records:', migration.length);
console.log('Unique Professors:', migProfs.size);
console.log('Unique Subjects:', new Set(migration.map(r => r.Asignatura)).size);

console.log('\n--- Horario Actualizado ---');
console.log('Total records:', actualizado.length);
console.log('Unique Professors:', actProfs.size);

const common = [...migProfs].filter(p => actProfs.has(p));
console.log('\nCommon Professors:', common.length);
console.log('Only in Migration:', [...migProfs].filter(p => !actProfs.has(p)).length);
console.log('Only in Actualizado:', [...actProfs].filter(p => !migProfs.has(p)).length);
