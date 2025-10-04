const inputText = document.getElementById('inputText');
const outputHTML = document.getElementById('outputHTML');
const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyBtn');

// Generate HTML
function generateStaticHTML(text){
    const encoded = btoa(unescape(encodeURIComponent(text))); // Base64
    // HTML yang bisa langsung tampil rapi di Blogger
    return `<div class="staticrypt-box" data-content="${encoded}" style="background:#1e1e1e; padding:15px; border-radius:12px; color:#eee; font-family:Arial,sans-serif;">
Loading content...
</div>
<script>
(function(){
    const container = document.currentScript.previousElementSibling;
    const encrypted = container.getAttribute("data-content");
    try {
        const decoded = decodeURIComponent(escape(atob(encrypted)));
        container.innerHTML = decoded; // tampil rapi langsung
    } catch(e){
        container.innerHTML = "Failed to decode content.";
    }
})();
</script>`;
}

// Tombol generate
generateBtn.addEventListener('click', () => {
    const text = inputText.value.trim();
    if(text){
        outputHTML.value = generateStaticHTML(text);
    } else {
        alert("Please enter some text to generate HTML");
    }
});

// Tombol copy
copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(outputHTML.value).then(() => {
        alert("HTML copied! Paste it in Blogger or your site.");
    });
});
