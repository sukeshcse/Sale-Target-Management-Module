// One-off script to (re)generate the sample import file committed at samples/target-import-sample.xlsx.
// Run with: node scripts/generate-sample-xlsx.js
// Matches the "Q1 2024 - Store-wise Target" plan produced by the seed script (Store / Monthly / 2024-01-01..2024-03-31).
const { Workbook } = require('exceljs');
const path = require('node:path');

const ROWS = [
  ['2024-Jan', 'STR001', 'Store North', 150000],
  ['2024-Feb', 'STR001', 'Store North', 175000],
  ['2024-Mar', 'STR001', 'Store North', 160000],
  ['2024-Jan', 'STR002', 'Store South', 120000],
  ['2024-Feb', 'STR002', 'Store South', 130000],
  ['2024-Mar', 'STR002', 'Store South', 140000],
];

async function main() {
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet('Targets');
  sheet.columns = [
    { header: 'Period', key: 'period', width: 12 },
    { header: 'DimensionCode', key: 'dimensionCode', width: 16 },
    { header: 'DimensionName', key: 'dimensionName', width: 20 },
    { header: 'TargetValue', key: 'targetValue', width: 14 },
  ];
  for (const [period, dimensionCode, dimensionName, targetValue] of ROWS) {
    sheet.addRow({ period, dimensionCode, dimensionName, targetValue });
  }
  sheet.getRow(1).font = { bold: true };

  const outPath = path.join(__dirname, '..', 'samples', 'target-import-sample.xlsx');
  await workbook.xlsx.writeFile(outPath);
  console.log('Wrote', outPath);
}

main();
