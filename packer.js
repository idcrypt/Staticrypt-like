// packer.js
// Usage: node packer.js input.html dist/index.html [--obf]
// Inlines relative CSS/JS, optional JS obfuscation (--obf), base64-encodes HTML,
// and outputs a single loader HTML that decodes and document.write() the original.

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node packer.js input.html dist/index.html [--obf]');
  process.exit(1);
}
const inputFile = args[0];
const outputFile = args[1];
const doObf = args.includes('--obf');

function readFileSafe(p) {
  try { return fs.readFileSync(p, 'utf8'); }
  catch (e) { return null; }
}

let html = readFileSafe(inputFile);
if (html === null) {
  console.error('Cannot read input file:', inputFile);
  process.exit(1);
}

const baseDir = path.dirname(path.resolve(inputFile));

// Inline CSS <link rel="stylesheet" href="...">
html = html.replace(/<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi, (m, href) => {
  // only inline relative local files (no http/https)
  if (/^(https?:)?\/\//i.test(href)) return m;
  const cssPath = path.resolve(baseDir, href);
  const css = readFileSafe(cssPath);
  if (css === null) { console.warn('Skipping CSS inline, not found:', href); return m; }
  const safe = css.replace(/<\/style>/gi, '<\\/style>');
  return `<style>${safe}</style>`;
});

// Inline JS <script src="..."></script>
html = html.replace(/<script\s+[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi, (m, src) => {
  if (/^(https?:)?\/\//i.test(src)) return m;
  const jsPath = path.resolve(baseDir, src);
  let js = readFileSafe(jsPath);
  if (js === null) { console.warn('Skipping JS inline, not found:', src); return m; }
  js = js.replace(/<\/script>/gi, '<\\/script>');
  return `<script>${js}</script>`;
});

// Basic minify: remove HTML comments and collapse whitespace between tags
function minifyHTML(s) {
  return s.replace(/<!--[\s\S]*?-->/g, '')
          .replace(/\s{2,}/g, ' ')
          .replace(/>\s+</g, '><')
          .trim();
}
html = minifyHTML(html);

// Optional JS obfuscation for inline <script> blocks
if (doObf) {
  try {
    const JavaScriptObfuscator = require('javascript-obfuscator');
    html = html.replace(/<script>([\s\S]*?)<\/script>/gi, (m, js) => {
      try {
        const obf = JavaScriptObfuscator.obfuscate(js, {
          compact: true,
          controlFlowFlattening: true,
          controlFlowFlatteningThreshold: 0.75,
          numbersToExpressions: true,
          simplify: true,
          stringArray: true,
          stringArrayEncoding: ['rc4'],
          rotateStringArray: true
        }).getObfuscatedCode();
        return `<script>${obf}</script>`;
      } catch (ex) {
        console.warn('JS obfuscation failed, keeping original block.');
        return `<script>${js}</script>`;
      }
    });
  } catch (e) {
    console.warn('javascript-obfuscator not installed. Install with: npm i --save-dev javascript-obfuscator');
  }
}

// Base64 encode the final HTML
const b64 = Buffer.from(html, 'utf8').toString('base64');

// Split into chunks (avoid extremely long literal)
const chunkSize = 8 * 1024; // 8KB
const chunks = [];
for (let i = 0; i < b64.length; i += chunkSize) {
  chunks.push(b64.slice(i, i + chunkSize));
}

// Try to load a loader template file (optional)
let loaderTemplate = null;
const loaderTemplatePath = path.resolve(path.dirname(__filename), 'loader-template.html');
if (fs.existsSync(loaderTemplatePath)) {
  loaderTemplate = readFileSafe(loaderTemplatePath);
}

// Default loader if template not provided
const defaultLoader = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Loading...</title>
<style>
  body{background:#0b0b0d;color:#eee;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
  .box{font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;text-align:center;}
  .spinner{width:48px;height:48px;border-radius:50%;border:5px solid rgba(255,255,255,0.06);border-top-color:#7c4dff;animation:spin 1s linear infinite;margin:0 auto 12px}
  @keyframes spin{to{transform:rotate(360deg)}}
  a.info{color:#9b9bff;text-decoration:none}
</style>
</head>
<body>
  <div class="box">
    <div class="spinner"></div>
    <div>Loading content…</div>
    <div style="margin-top:8px"><a class="info" href="#" onclick="location.reload();return false;">Reload</a></div>
  </div>
<script>
(function(){
  try {
    var chunks = ${JSON.stringify(chunks)};
    var b64 = chunks.join('');
    var html = atob(b64);
    document.open();
    document.write(html);
    document.close();
  } catch (e) {
    document.body.innerHTML = '<div style="padding:20px;color:#fff;background:#900">Failed to load content. Check console.</div>';
    console.error('Unpack error', e);
  }
})();
</script>
</body>
</html>`;

// choose loader content
const loader = loaderTemplate ? loaderTemplate.replace('/*{{CHUNKS}}*/', JSON.stringify(chunks)) : defaultLoader;

// Ensure output dir exists
const outDir = path.dirname(path.resolve(outputFile));
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outputFile, loader, 'utf8');
console.log('Packed', inputFile, '→', outputFile, doObf ? '(with JS obfuscation)' : '');
