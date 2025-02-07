function generateQR() {
    if (!document.getElementById('text').value) {
        alert('Please enter text to generate QR code');
        return;
    }
    const text = document.getElementById('text').value;
    fetch(`/generate-qr?text=${encodeURIComponent(text)}`)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            const qr = document.getElementById('qr');
            qr.innerHTML = `
                <img src="${data.url}">
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
                const qr = document.getElementById('qr');
                qr.innerHTML = '';
                alert('QR code discarded.');
            } else {
                alert('Failed to discard QR code.');
            }
        })
        .catch(error => console.error(error));
}