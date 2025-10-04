const inputText = document.getElementById('inputText');
const outputHTML = document.getElementById('outputHTML');
const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyBtn');

// Fungsi generate HTML Staticrypt-like (no password)
function generateStaticHTML(text){
    const encoded = btoa(unescape(encodeURIComponent(text)));
    return `
<div style="background:#1e1e1e; padding:20px; border-radius:12px; color:#eee; font-family:Arial,sans-serif;">
  <h3>Staticrypt Content</h3>
  <pre style="background:#2b2b2b; padding:10px; border-radius:8px; overflow-x:auto;">${encoded}</pre>
</div>`;
}

generateBtn.addEventListener('click', () => {
    const text = inputText.value.trim();
    if(text){
        outputHTML.value = generateStaticHTML(text);
    } else {
        alert("Please enter some text to generate HTML");
    }
});

copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(outputHTML.value).then(() => {
        alert("HTML copied!");
    });
});
