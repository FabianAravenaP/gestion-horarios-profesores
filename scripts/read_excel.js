import xlsx from 'xlsx';

const workbook = xlsx.readFile('C:/Users/pbero/Documents/app_instituto_comercial/documentos/asiste.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

console.log(JSON.stringify(data, null, 2));
