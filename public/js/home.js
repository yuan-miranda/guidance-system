function editableCell(cell) {
    if (cell.querySelector("input")) return;

    let originalText = cell.innerText;
    let input = document.createElement("input");
    input.type = "text";
    input.value = originalText;
    input.style.outline = "none";
    cell.innerHTML = "";
    cell.appendChild(input);
    input.focus();

    input.onblur = () => cell.innerHTML = input.value || originalText;

    input.onkeydown = (event) => {
        if (event.key === "Enter") input.blur();
    };
}

function addData(event) {
    event.preventDefault();

    const formData = new FormData(document.getElementById('addDataForm'));

    fetch('/addStudentData', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            window.location.reload();
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

function filterHome() {
    document.getElementById('searchBar').addEventListener('input', () => {
        const searchInput = document.getElementById('searchBar').value.toLowerCase();

        fetch(`/searchStudentData?q=${encodeURIComponent(searchInput)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch student data');
                }
                return response.json();
            })
            .then(data => {
                const dataTableRow = document.getElementById('tableBody');
                dataTableRow.innerHTML = '';

                if (data.length === 0) {
                    dataTableRow.innerHTML = '<tr><td colspan="12" id="notFound">No data found.</td></tr>';
                    return;
                }

                data.forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${item.date || ''}</td>
                        <td>${item.student_id || ''}</td>
                        <td>${item.level || ''}</td>
                        <td>${item.program || ''}</td>
                        <td>${item.guidance_service_availed || ''}</td>
                        <td>${item.contact_type || ''}</td>
                        <td>${item.nature_of_concern || ''}</td>
                        <td>${item.specific_concern || ''}</td>
                        <td>${item.concern || ''}</td>
                        <td>${item.intervention || ''}</td>
                        <td>${item.status || ''}</td>
                        <td>${item.remarks || ''}</td>
                    `;
                    dataTableRow.appendChild(row);
                });
            })
            .catch(error => {
                console.error('Error:', error);
                const dataTableRow = document.getElementById('tableBody');
                dataTableRow.innerHTML = '<tr><td colspan="12">Failed to load data. Please try again later.</td></tr>';
            });
    });
}

function openAddModal() {
    document.getElementById('addDataModal').style.display = 'block';
}

function closeAddModal() {
    document.getElementById('addDataModal').style.display = 'none';
}

function openQrScannerModal() {
    document.getElementById('qrScannerModal').style.display = 'block';
    openQRCodeScanner();
}

function closeQrScannerModal() {
    document.getElementById('qrScannerModal').style.display = 'none';
    closeQRCodeScanner()
}

function onScanSuccess(decodeText, decodeResult) {
    window.location.href = decodeText;
}

function openQRCodeScanner() {
    html5QrCode = new Html5QrcodeScanner(
        "reader", { fps: 10, qrbox: 250 * 2 }
    );
    html5QrCode.render(onScanSuccess);
}

function closeQRCodeScanner() {
    if (html5QrCode) html5QrCode.clear();
}

function keyEventListener(event) {
    if (event.ctrlKey && event.key === 'k') {
        event.preventDefault();
        document.querySelector('input[type="search"]').focus();
    }
    if (event.key === 'Escape') {
        closeAddModal();
        closeQrScannerModal();
    }
}

let html5QrCode;

document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('keydown', keyEventListener);
});