const inputArea = document.getElementById('inputArea');
const outputArea = document.getElementById('outputArea');
const copyBtn = document.getElementById('copyBtn');
const status = document.getElementById('status');

// Simple "staticrypt-like" formatting: base64 encode
function encryptText(text) {
    return btoa(unescape(encodeURIComponent(text)));
}

// Update output as user types
inputArea.addEventListener('input', () => {
    const text = inputArea.value;
    outputArea.textContent = encryptText(text);
});

// Copy button
copyBtn.addEventListener('click', () => {
    const text = outputArea.textContent;
    navigator.clipboard.writeText(text).then(() => {
        status.classList.remove('hidden');
        setTimeout(() => status.classList.add('hidden'), 1500);
    });
});
