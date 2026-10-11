// Turns the single-file build into a page for a hosted Artifact: the host supplies the
// <!doctype>/<html>/<head>/<body> skeleton (charset + viewport), so we ship only the inner parts.
// Usage: npm run build && node scripts/artifact.mjs  → artifact/index.html (+ photos in dist/players)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const html = readFileSync('dist/index.html', 'utf8');
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];

const title = head.match(/<title>[\s\S]*?<\/title>/)[0];
const keep = head
  .replace(/<title>[\s\S]*?<\/title>/, '')
  .replace(/<meta[^>]*>/g, '') // charset/viewport come from the host skeleton
  .replace(/<link rel="icon"[^>]*>/, '') // the host sets the tab icon
  .trim();

mkdirSync('artifact', { recursive: true });
writeFileSync('artifact/index.html', `${title}\n${keep}\n${body.trim()}\n`);
console.log(`artifact/index.html ${(Buffer.byteLength(readFileSync('artifact/index.html')) / 1024).toFixed(0)} KB`);
