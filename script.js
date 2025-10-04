const inputArea = document.getElementById('inputArea');
const outputArea = document.getElementById('outputArea');
const copyBtn = document.getElementById('copyBtn');
const status = document.getElementById('status');

function encryptText(text){
    return btoa(unescape(encodeURIComponent(text)));
}

inputArea.addEventListener('input', () => {
    outputArea.textContent = encryptText(inputArea.value);
});

copyBtn.addEventListener('click', () => {
    const text = outputArea.textContent;
    navigator.clipboard.writeText(text).then(() => {
        status.classList.remove('hidden');
        setTimeout(() => status.classList.add('hidden'), 1500);
    });
});
