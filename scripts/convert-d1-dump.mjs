import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const [, , inputArg, outputArg] = process.argv;

if (!inputArg) {
  console.error('Usage: npm run migrate:d1-dump -- <d1_dump.sql> [converted_dump.sql]');
  process.exit(1);
}

const inputPath = path.resolve(inputArg);
const outputPath = path.resolve(outputArg || 'converted_dump.sql');

const source = await readFile(inputPath, 'utf8');

const tables = [
  'users',
  'timeline_events',
  'albums',
  'photos',
  'diaries',
  'food_checkins',
  'notes',
  'settings',
  'todos',
  'map_checkins',
  'time_capsules',
  'images',
];

const sequenceValues = new Map();
const statements = source
  .split(/;\s*(?:\r?\n|$)/)
  .map((statement) => statement.trim())
  .filter(Boolean);

const inserts = [];

for (const statement of statements) {
  const sqliteSequenceMatch = statement.match(
    /^INSERT INTO "?sqlite_sequence"? \("name","seq"\) VALUES\('([^']+)',(\d+)\)$/i
  );
  if (sqliteSequenceMatch) {
    sequenceValues.set(sqliteSequenceMatch[1], sqliteSequenceMatch[2]);
    continue;
  }

  if (!/^INSERT INTO /i.test(statement) || /^INSERT INTO "?sqlite_sequence"?/i.test(statement)) {
    continue;
  }

  let converted = statement
    .replace(/https:\/\/img\.980823\.xyz\//g, '/uploads/')
    .replace(/https:\/\/[^/'"]+\.r2\.dev\//g, '/uploads/')
    .replace(/\bchar\(10\)/gi, 'chr(10)');

  inserts.push(`${converted};`);
}

const output = [
  '-- Data-only PostgreSQL import generated from Cloudflare D1 dump.',
  '-- Run server/migrations/001_init.sql before this file.',
  'BEGIN;',
  `TRUNCATE ${tables.map((table) => `"${table}"`).join(', ')} RESTART IDENTITY CASCADE;`,
  ...inserts,
  ...Array.from(sequenceValues.entries())
    .filter(([table]) => tables.includes(table))
    .map(([table, seq]) => `SELECT setval(pg_get_serial_sequence('${table}', 'id'), ${seq}, true);`),
  'COMMIT;',
  '',
].join('\n');

await writeFile(outputPath, output, 'utf8');

console.log(`Converted ${inputPath} -> ${outputPath}`);
