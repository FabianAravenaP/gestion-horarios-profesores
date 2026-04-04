const XLSX = require('xlsx');
const fs = require('fs');

function dumpSheet(filePath, outputName) {
  try {
    const workbook = XLSX.readFile(filePath);
    const result = {};
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      result[sheetName] = XLSX.utils.sheet_to_json(sheet);
    });
    fs.writeFileSync(outputName, JSON.stringify(result, null, 2));
    console.log(`Successfully dumped ${filePath} to ${outputName}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

dumpSheet('../Horario_Actualizado_2026.xlsx', 'horario_actualizado.json');
dumpSheet('../manual_migration_2026.xlsx', 'manual_migration.json');
