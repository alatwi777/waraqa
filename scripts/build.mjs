import { cp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
await rm(resolve(root, 'dist'), { recursive: true, force: true });
await mkdir(resolve(root, 'dist'), { recursive: true });
await cp(resolve(root, 'public'), resolve(root, 'dist'), { recursive: true });
await writeFile(resolve(root, 'dist/index.html'), await readFile(resolve(root, 'site/index.html')));
// Only the external build changes sign-in wording and links. Shared authored files stay identical.
for (const file of ['index.html', 'cloud.js', 'app.js']) {
  const target = resolve(root, 'dist', file);
  const text = (await readFile(target, 'utf8')).replaceAll('/signin-with-chatgpt?return_to=%2F', '/cdn-cgi/access/login').replaceAll('ChatGPT', 'الموقع');
  await writeFile(target, text);
}
console.log('Built standalone assets in dist/');
