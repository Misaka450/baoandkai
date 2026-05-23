import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'release', 'bbkk-runtime');

async function copyRequired(from, to) {
  const source = path.join(root, from);
  if (!existsSync(source)) {
    throw new Error(`Missing required path: ${from}`);
  }
  await cp(source, path.join(outDir, to ?? from), { recursive: true });
}

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
await mkdir(path.join(outDir, 'server'), { recursive: true });

await copyRequired('dist');
await copyRequired('server/dist', 'server/dist');
await copyRequired('server/package.json', 'server/package.json');
await copyRequired('server/package-lock.json', 'server/package-lock.json');
await copyRequired('server/migrations', 'server/migrations');
await copyRequired('nginx');
await copyRequired('uploads');
await copyRequired('converted_dump.sql');
await copyRequired('.env.docker.example');
await copyRequired('Dockerfile.runtime');
await copyRequired('docker-compose.runtime.yml');

console.log(`Runtime bundle created at ${outDir}`);
