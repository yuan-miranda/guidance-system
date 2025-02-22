function generateQR() {
    if (!document.getElementById('text').value) {
        alert('Please enter text to generate QR code');
        return;
    }
    const text = document.getElementById('text').value;
    fetch(`/generate-qr?text=${encodeURIComponent(text)}`)
        .then(response => response.json())
        .then(data => {
            const qrImagePreview = document.getElementById('qrImagePreview');
            const generateQRDiscardButton = document.getElementById('generateQRDiscardButton');
            const generateQRDownloadButton = document.getElementById('generateQRDownloadButton');
            generateQRDiscardButton.disabled = false;
            generateQRDownloadButton.disabled = false;
            
            qrImagePreview.innerHTML = `
                <img src="${data.url}" alt="${data.url}" style="max-width: 100%; height: auto;">
            `;
        })
        .catch(error => console.error(error));
}

function saveQR() {
    const qrImagePreview = document.getElementById('qrImagePreview');
    const qrImage = qrImagePreview.firstElementChild;
    const a = document.createElement('a');
    const filename = qrImage.alt.replace('qr/', '');
    a.href = qrImage.src;
    a.download = filename;
    a.click();
    a.remove();
}

function discardQR(url) {
    fetch(`/delete-qr?file=${encodeURIComponent(url)}`, { method: 'DELETE' })
        .then(response => {
            if (response.ok) {
                const qrImagePreview = document.getElementById('qrImagePreview');
                const generateQRDiscardButton = document.getElementById('generateQRDiscardButton');
                const generateQRDownloadButton = document.getElementById('generateQRDownloadButton');
                const text = document.getElementById('text');
                qrImagePreview.innerHTML = '';
                text.focus();
                generateQRDiscardButton.disabled = true;
                generateQRDownloadButton.disabled = true;
                // alert('QR code discarded.');
                // toast
            } else {
                // alert('Failed to discard QR code.');
                // toast
            }
        })
        .catch(error => console.error(error));
}

function openGenerateQRModal() {
    const generateQRDiscardButton = document.getElementById('generateQRDiscardButton');
    const generateQRDownloadButton = document.getElementById('generateQRDownloadButton');
    const text = document.getElementById('text');
    generateQRDiscardButton.disabled = true;
    generateQRDownloadButton.disabled = true;
    text.focus();
}

function closeGenerateQRModal() {
    const qrImagePreview = document.getElementById('qrImagePreview');
    if (qrImagePreview.firstElementChild) discardQR(document.getElementById('qrImagePreview').firstElementChild.alt);
    document.getElementById('text').value = '';
}

function qrEventListener() {
    document.getElementById('generateQRModal').addEventListener('shown.bs.modal', () => openGenerateQRModal());
    document.getElementById('generateQRModal').addEventListener('hidden.bs.modal', () => closeGenerateQRModal());
    document.getElementById('generateQRDiscardButton').addEventListener('click', () => closeGenerateQRModal());
    document.getElementById('generateQRDownloadButton').addEventListener('click', saveQR);
    document.getElementById('button-addon2').addEventListener('click', generateQR);
}

document.addEventListener('DOMContentLoaded', () => {
    qrEventListener();
});