// Builds dist/esm (ES modules) and dist/cjs (CommonJS), each with type
// declarations, so the package works with both import and require.
import { execFileSync } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const tsc = createRequire(import.meta.url).resolve('typescript/bin/tsc');
rmSync('dist', { recursive: true, force: true });
execFileSync(process.execPath, [tsc, '-p', 'tsconfig.json'], { stdio: 'inherit' });
execFileSync(process.execPath, [tsc, '-p', 'tsconfig.cjs.json'], { stdio: 'inherit' });
// Files under dist/cjs are CommonJS whatever the root package.json says.
writeFileSync('dist/cjs/package.json', '{\n  "type": "commonjs"\n}\n');
