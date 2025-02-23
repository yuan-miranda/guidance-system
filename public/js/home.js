function addRow(id = null, date = null, student_id = null, level = null, program = null, guidance_service_availed = null, contact_type = null, nature_of_concern = null, specific_concern = null, concern = null, intervention = null, status = null, remarks = null, focus = true) {
    const row = document.createElement("tr");
    const nextRowCount = document.querySelectorAll("#tableBody tr").length + 1;
    row.innerHTML = `
        <td id="notEditable">${id || nextRowCount}</td>
        <td contenteditable="true">${date || ''}</td>
        <td contenteditable="true">${student_id || ''}</td>
        <td contenteditable="true">${level || ''}</td>
        <td contenteditable="true">${program || ''}</td>
        <td contenteditable="true">${guidance_service_availed || ''}</td>
        <td contenteditable="true">${contact_type || ''}</td>
        <td contenteditable="true">${nature_of_concern || ''}</td>
        <td contenteditable="true">${specific_concern || ''}</td>
        <td contenteditable="true">${concern || ''}</td>
        <td contenteditable="true">${intervention || ''}</td>
        <td contenteditable="true">${status || ''}</td>
        <td contenteditable="true">${remarks || ''}</td>
    `;
    document.getElementById("tableBody").appendChild(row);

    const cells = row.querySelectorAll("td");
    cellNav(cells);

    if (cells.length > 1 && focus) {
        cells[1].focus();
    }
}

function cellNav(cells) {
    cells.forEach((cell, index) => {
        cell.addEventListener("keydown", (event) => {
            let nextIndex = null;
            let currentRow = cell.parentElement;
            let allRows = Array.from(document.querySelectorAll("#tableBody tr"));
            let currentRowIndex = allRows.indexOf(currentRow);

            if (event.key === "Enter") {
                event.preventDefault();
                nextIndex = index + 1;
            } else if (event.key === "Tab") {
                event.preventDefault();
                nextIndex = event.shiftKey ? index - 1 : index + 1;
            } else if (event.key === "ArrowRight") {
                nextIndex = index + 1;
            } else if (event.key === "ArrowLeft") {
                nextIndex = index - 1;
            } else if (event.key === "ArrowDown") {
                event.preventDefault();
                if (currentRowIndex < allRows.length - 1) {
                    let nextRow = allRows[currentRowIndex + 1];
                    let nextCell = nextRow.children[index];
                    if (nextCell) nextCell.focus();
                }
            } else if (event.key === "ArrowUp") {
                event.preventDefault();
                if (currentRowIndex > 0) {
                    let prevRow = allRows[currentRowIndex - 1];
                    let prevCell = prevRow.children[index];
                    if (prevCell) prevCell.focus();
                }
            }

            // move focus to the next cell if within bounds
            if (nextIndex !== null && nextIndex >= 0 && nextIndex < cells.length) cells[nextIndex].focus();
        });
    });
}

async function populateTable() {
    // lol
    await search();
}

async function saveChanges() {
    const tableBody = document.getElementById('tableBody');
    const rows = tableBody.querySelectorAll('tr');

    const data = Array.from(rows).map(row => {
        const cells = row.querySelectorAll('td');
        return Array.from(cells).map(cell => {
            let value = cell.innerText;
            return value === "" ? null : value;
        });
    });

    try {
        const response = await fetch('/saveChanges', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            console.error('Failed to save changes');
            return;
        }

        const result = await response.json();
        console.log(result);
    } catch (error) {
        console.error('Error:', error);
    }
}

async function search(searchQuery = null) {
    const searchBar = document.getElementById('searchBar');
    if (searchQuery !== null) searchBar.value = searchQuery;

    const searchInput = searchBar.value.trim().toLowerCase();
    const dataTableRow = document.getElementById('tableBody');

    try {
        const response = await fetch(`/search?q=${encodeURIComponent(searchInput)}`);
        if (!response.ok) console.error('Failed to fetch data');
        
        const data = await response.json();
        dataTableRow.innerHTML = '';

        if (data.length === 0 && searchInput !== '') {
            dataTableRow.innerHTML = '<tr><td colspan="13" id="notFound">No data found.</td></tr>';
            return;
        }

        data.forEach(item => {
            addRow(item.id, item.date, item.student_id, item.level, item.program, item.guidance_service_availed, item.contact_type, item.nature_of_concern, item.specific_concern, item.concern, item.intervention, item.status, item.remarks, false);
        });
    } catch (error) {
        console.error('Error:', error);
        dataTableRow.innerHTML = '<tr><td colspan="13">Failed to load data. Please try again later.</td></tr>';
    }
}

function handleQRScanURL() {
    const searchBar = document.getElementById('searchBar');
    const url = new URLSearchParams(window.location.search);
    const searchQuery = url.get('search');
    if (searchQuery) {
        searchBar.value = searchQuery;
        search(searchQuery);
        searchBar.focus();
        searchBar.setSelectionRange(searchBar.value.length, searchBar.value.length);
    }
}

function openQrScannerModal() {
    openQRCodeScanner();
}

function closeQrScannerModal() {
    closeQRCodeScanner()
}

function onScanSuccess(decodeText, decodeResult) {
    window.location.href = decodeText;
}

function openQRCodeScanner() {
    html5QrCode = new Html5QrcodeScanner(
        "reader", { fps: 10, qrbox: 250 * 3 }
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
        closeQrScannerModal();
        document.activeElement.blur();
    }
}

function searchEventListener() {
    document.addEventListener('keydown', keyEventListener);
    document.getElementById('searchBar').addEventListener('input', () => search());
    document.getElementById('searchForm').addEventListener('submit', (event) => event.preventDefault());
    document.getElementById('qrCodeScanIcon').addEventListener('click', openQrScannerModal);
    document.getElementById('closeQrScannerModalTitle').addEventListener('click', closeQrScannerModal);
    document.getElementById('closeQrScannerModalFooter').addEventListener('click', closeQrScannerModal);
    document.getElementById('addRowButton').addEventListener('click', async () => {
        await search('');
        addRow();
    });
    document.querySelector("#tableBody").addEventListener("blur", async (event) => {
        if (event.target.tagName === "TD" && event.target.hasAttribute("contenteditable")) await saveChanges();
    }, true);
}

let html5QrCode;

document.addEventListener('DOMContentLoaded', async () => {
    await search();
    searchEventListener();
    handleQRScanURL();
});