// Supports the current flattened GitHub upload and the original folder layout.
// Copies only public assets and the server function into their deployment folders.
import { mkdir, copyFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const files = [
 ['index.html', 'public/index.html'],
 ['app.js', 'public/app.js'],
 ['styles.css', 'public/styles.css'],
 ['robots.txt', 'public/robots.txt'],
 ['Symbo-Concierge.vcf', 'public/Symbo-Concierge.vcf'],
 ['diya.png', 'public/assets/diya.png'],
 ['symbo-logo-on-dark.png', 'public/assets/symbo-logo-on-dark.png'],
 ['privilege.mjs', 'netlify/functions/privilege.mjs'],
];
async function exists(file) { try { await access(file); return true; } catch { return false; } }
for (const [flat, nested] of files) {
 const destination = path.join(root, nested);
 // Prefer an existing original-layout file; don't overwrite it from a stale root copy.
 if (await exists(destination)) continue;
 const source = path.join(root, flat);
 if (!(await exists(source))) throw new Error(`Missing ${flat}. Upload this file from the implementation kit and redeploy.`);
 await mkdir(path.dirname(destination), { recursive: true });
 await copyFile(source, destination);
 console.log(`Prepared ${nested}`);
}
console.log('Deployment folders ready: public/ and netlify/functions/.');
