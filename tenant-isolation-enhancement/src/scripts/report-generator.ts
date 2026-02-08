import { readFileSync, writeFileSync } from 'fs';

const jsonPath = process.argv[2] || 'tenant-consistency-report.json';
const data = JSON.parse(readFileSync(jsonPath, 'utf-8'));

const rows = data.findings || [];
const csv = ['model,fromId,fromTenant,toId,toTenant']
    .concat(rows.map((r: any) => `${r.model},${r.fromId},${r.fromTenant},${r.toId},${r.toTenant}`))
    .join('
');

writeFileSync('tenant-consistency-report.csv', csv);

const html = `
<html><body><h1>Tenant Consistency Report</h1><pre>${JSON.stringify(data, null, 2)}</pre></body></html>`;
writeFileSync('tenant-consistency-report.html', html);

console.log('Report generated: tenant-consistency-report.csv/html');
