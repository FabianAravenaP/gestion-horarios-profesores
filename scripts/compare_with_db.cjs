const migration = require('../manual_migration.json').Sheet1;
const fs = require('fs');

const dbProfs = JSON.parse(fs.readFileSync('./db_profs.json'));
const dbAsigs = JSON.parse(fs.readFileSync('./db_asigs.json'));

const migProfs = [...new Set(migration.map(r => r.Profesor))];
const migAsigs = [...new Set(migration.map(r => r.Asignatura))];

const missingProfs = migProfs.filter(mp => !dbProfs.some(dp => dp.nombre.toLowerCase() === mp.toLowerCase()));
const missingAsigs = migAsigs.filter(ma => !dbAsigs.some(da => da.nombre.toLowerCase() === ma.toLowerCase()));

console.log('--- Missing in DB ---');
console.log('Professors:', missingProfs);
console.log('Subjects:', missingAsigs);
