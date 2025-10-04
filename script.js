const copyBtn = document.getElementById('copyBtn');
const contentBox = document.getElementById('contentBox');
const status = document.getElementById('status');

copyBtn.addEventListener('click', () => {
    const text = contentBox.innerText;
    navigator.clipboard.writeText(text).then(() => {
        status.classList.remove('hidden');
        setTimeout(() => status.classList.add('hidden'), 1500);
    });
});
