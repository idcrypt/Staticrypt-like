const inputText = document.getElementById('inputText');
const outputHTML = document.getElementById('outputHTML');
const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyBtn');

function generateStaticHTML(text){
    const encoded = btoa(unescape(encodeURIComponent(text))); // encode ke Base64
    // HTML yang men-decode di browser
    return `<div class="staticrypt-container" data-content="${encoded}" 
style="background:#1e1e1e; padding:15px; border-radius:12px; color:#eee; font-family:Arial,sans-serif;">
Loading content...
</div>
<script>
(function(){
    const container = document.currentScript.previousElementSibling;
    const encrypted = container.getAttribute("data-content");
    try {
        const decoded = decodeURIComponent(escape(atob(encrypted)));
        container.textContent = decoded;
    } catch(e){
        container.textContent = "Failed to decode content.";
    }
})();
</script>`;
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
        alert("HTML copied! Paste it in Blogger or your site.");
    });
});
