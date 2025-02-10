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
            qrImagePreview.innerHTML = `
                <img src="${data.url}" style="max-width: 100%; height: auto;">
                <div>
                    <button id="saveBtn" onclick="saveQR()">Save</button>
                    <button id="discardBtn" onclick="discardQR('${data.url}')">Discard</button>
                </div>
            `;
        })
        .catch(error => console.error(error));
}

function saveQR() {
    alert('QR code saved');
}

function discardQR(url) {
    fetch(`/delete-qr?file=${encodeURIComponent(url)}`, { method: 'DELETE' })
        .then(response => {
            if (response.ok) {
                const qrImagePreview = document.getElementById('qrImagePreview');
                qrImagePreview.innerHTML = '';
                alert('QR code discarded.');
            } else {
                alert('Failed to discard QR code.');
            }
        })
        .catch(error => console.error(error));
}