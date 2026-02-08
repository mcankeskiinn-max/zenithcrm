/**
 * TL;DR: JSON audit output'tan HTML rapor uretir
 */
import fs from 'fs';

const input = process.argv[2] || 'pre-production-audit.json';
const output = process.argv[3] || 'pre-production-audit.html';

const data = JSON.parse(fs.readFileSync(input, 'utf-8'));
const html = `
<html><body><h1>Pre-Production Audit</h1><pre>${JSON.stringify(data, null, 2)}</pre></body></html>`;
fs.writeFileSync(output, html);
console.log(`Audit report generated: ${output}`);
