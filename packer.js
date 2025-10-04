// packer.js
// Usage: node packer.js input.html dist/index.html [--obf]
// Requires node >=12
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node packer.js input.html dist/index.html [--obf]');
  process.exit(1);
}
const inputFile = args[0];
const outputFile = args[1];
const doObf = args.includes('--obf'); // jika mau obfuscate JS (requires js-obfuscator)

let html = fs.readFileSync(inputFile, 'utf8');

// Optional step: inline external CSS/JS (basic) -- replace <link rel="stylesheet" href="..."> and <script src="..."></script">
// NOTE: This is a simple inline step; for complex projects use a bundler.
html = html.replace(/<link\s+rel=["']stylesheet["']\s+href=["']([^"']+)["']\s*\/?>/gi, (m, href) => {
  try {
    const cssPath = path.resolve(path.dirname(inputFile), href);
    const css = fs.readFileSync(cssPath, 'utf8');
    return `<style>${css}</style>`;
  } catch (e) {
    console.warn('Warning: could not inline CSS', href);
    return m;
  }
});

html = html.replace(/<script\s+src=["']([^"']+)["']\s*><\/script>/gi, (m, src) => {
  try {
    const jsPath = path.resolve(path.dirname(inputFile), src);
    let js = fs.readFileSync(jsPath, 'utf8');
    // optionally obfuscate later, but we leave raw for now
    return `<script>${js}</script>`;
  } catch (e) {
    console.warn('Warning: could not inline script', src);
    return m;
  }
});

// optional small minify: remove comments and collapse whitespace (very basic)
function minifyHTML(s) {
  return s
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();
}
html = minifyHTML(html);

// Optional: if doObf true, attempt to obfuscate inline script blocks using 'javascript-obfuscator' package
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
          simplify: true
        }).getObfuscatedCode();
        return `<script>${obf}</script>`;
      } catch (e) {
        console.warn('JS obfuscation failed for block; keeping original');
        return `<script>${js}</script>`;
      }
    });
  } catch (e) {
    console.warn('javascript-obfuscator not installed. Run: npm i javascript-obfuscator --save-dev');
  }
}

// Now base64 encode the whole HTML
const b64 = Buffer.from(html, 'utf8').toString('base64');

// Optionally split into small chunks to avoid any string literal limits (not strictly necessary)
const chunkSize = 1024 * 8;
const chunks = [];
for (let i=0;i<b64.length;i+=chunkSize) chunks.push(b64.slice(i, i+chunkSize));

// Loader template (produces final HTML)
const loader = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Loading…</title>
<style>
  /* minimal loader style */
  body{background:#0b0b0d;color:#eee;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
  .box{font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;text-align:center;}
  .spinner{width:48px;height:48px;border-radius:50%;border:5px solid rgba(255,255,255,0.08);border-top-color:#7c4dff;animation:spin 1s linear infinite;margin:0 auto 12px}
  @keyframes spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>
  <div class="box">
    <div class="spinner"></div>
    <div>Loading...</div>
  </div>

<script>
(function(){
  // packed base64 chunks
  var chunks = ${JSON.stringify(chunks)};
  // join and decode
  try {
    var b64 = chunks.join('');
    var decoded = atob(b64);
    // write into document
    document.open();
    document.write(decoded);
    document.close();
  } catch (e) {
    document.body.innerHTML = '<div style="padding:20px;color:#fff;background:#900">Failed to load content. Open console for details.</div>';
    console.error('Unpack error', e);
  }
})();
</script>
</body>
</html>`;

// create dist folder if needed
const outDir = path.dirname(outputFile);
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outputFile, loader, 'utf8');
console.log('Packed to', outputFile);
