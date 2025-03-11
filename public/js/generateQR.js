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

async function generateQRMultiple() {
    const file = document.getElementById('file').files[0];
    if (!file) {
        alert('Please select a file to generate QR codes');
        return;
    }
    if (!file.name.match(/\.(xls|xlsx)$/i)) {
        alert('Only .xls or .xlsx files are allowed.');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/generate-qr-multiple', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        const qrImagePreview = document.getElementById('qrImagePreviewMultiple');
        const qrImagePreviewCount = document.getElementById('qrImagePreviewMultipleCount');
        const generateQRDiscardButton = document.getElementById('generateQRDiscardButton');
        const generateQRDownloadButton = document.getElementById('generateQRDownloadButton');
        generateQRDiscardButton.disabled = false;
        generateQRDownloadButton.disabled = false;

        qrImagePreviewCount.innerHTML = `Generated ${data.length} QR codes`;

        data.forEach(url => {
            qrImagePreview.innerHTML += `
                <img src="${url}" alt="${url}" style="max-width: 100%; height: auto;">
            `;
        });

    } catch (error) {
        console.error(error);
    }
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

function saveQRMultiple() {
    const qrImagePreview = document.getElementById('qrImagePreviewMultiple');
    qrImagePreview.querySelectorAll('img').forEach(qrImage => {
        const a = document.createElement('a');
        const filename = qrImage.alt.replace('qr/', '');
        a.href = qrImage.src;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
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

function discardQRMultiple() {
    const qrImagePreview = document.getElementById('qrImagePreview');
    qrImagePreview.childNodes.forEach(qrImage => {
        fetch(`/delete-qr?file=${encodeURIComponent(qrImage.alt)}`, { method: 'DELETE' })
            .then(response => {
                if (response.ok) {
                    qrImage.remove();
                    // alert('QR code discarded.');
                    // toast
                } else {
                    // alert('Failed to discard QR code.');
                    // toast
                }
            })
            .catch(error => console.error(error));
    });
}

function openGenerateQRModal() {
    const generateQRDiscardButton = document.getElementById('generateQRDiscardButton');
    const generateQRDownloadButton = document.getElementById('generateQRDownloadButton');
    const text = document.getElementById('text');
    generateQRDiscardButton.disabled = true;
    generateQRDownloadButton.disabled = true;
    text.focus();
}

function clearInputs() {
    document.getElementById('text').value = '';
    const fileInput = document.getElementById('file');
    fileInput.value = '';

    document.getElementById('qrImagePreview').innerHTML = ''; 
    document.getElementById('qrImagePreviewMultiple').innerHTML = ''; 
    document.getElementById('qrImagePreviewMultipleCount').innerHTML = '';

    document.getElementById('generateQRDiscardButton').disabled = true;
    document.getElementById('generateQRDownloadButton').disabled = true;
}


function qrEventListener() {
    document.getElementById("flexRadioDefault1").addEventListener("change", () => {
        document.getElementById("generateQRSingle").classList.remove("d-none");
        document.getElementById("generateQRMultiple").classList.add("d-none");
        clearInputs();
    });

    document.getElementById("flexRadioDefault2").addEventListener("change", () => {
        document.getElementById("generateQRSingle").classList.add("d-none");
        document.getElementById("generateQRMultiple").classList.remove("d-none");
        clearInputs();
    });

    if (document.getElementById("flexRadioDefault2").checked) {
        document.getElementById("generateQRSingle").classList.add("d-none");
        document.getElementById("generateQRMultiple").classList.remove("d-none");
    } else {
        document.getElementById("generateQRSingle").classList.remove("d-none");
        document.getElementById("generateQRMultiple").classList.add("d-none");
    }
    

    document.getElementById('generateQRModal').addEventListener('shown.bs.modal', () => openGenerateQRModal());
    document.getElementById('generateQRModal').addEventListener('hidden.bs.modal', () => clearInputs());
    document.getElementById('generateQRDiscardButton').addEventListener('click', () => clearInputs());
    document.getElementById('generateQRDownloadButton').addEventListener('click', () => {
        if (document.getElementById('flexRadioDefault1').checked) saveQR();
        else saveQRMultiple();
    });

    document.getElementById('button-addon2').addEventListener('click', generateQR);
    document.getElementById('button-addon3').addEventListener('click', async () => {
        await generateQRMultiple();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    qrEventListener();
});