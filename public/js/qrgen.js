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
            qr.innerHTML = `<img src="${data.url}">`;
        })
        .catch(error => console.error(error));
}