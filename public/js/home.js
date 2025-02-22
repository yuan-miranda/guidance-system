function editableCell(cell) {
    if (cell.querySelector("input") || cell.id === "notEditable") return;

    let initialText = cell.innerText;
    let inputField = document.createElement("input");
    inputField.style.backgroundColor = "transparent";

    inputField.type = "text";
    inputField.value = initialText;
    inputField.style.outline = "none";
    cell.innerHTML = "";

    cell.appendChild(inputField);
    inputField.focus();

    inputField.onblur = () => {
        cell.innerHTML = inputField.value.trim() || initialText;
        saveChanges();
    }
    inputField.onkeydown = (event) => { if (event.key === "Enter") inputField.blur(); };
}

function addRow(id = null, date = null, student_id = null, level = null, program = null, guidance_service_availed = null, contact_type = null, nature_of_concern = null, specific_concern = null, concern = null, intervention = null, status = null, remarks = null, startEditing = true) {
    const row = document.createElement("tr");
    const nextRowCount = document.querySelectorAll("#tableBody tr").length + 1;
    row.innerHTML = `
        <td id="notEditable">${id || nextRowCount}</td>
        <td>${date || ''}</td>
        <td>${student_id || ''}</td>
        <td>${level || ''}</td>
        <td>${program || ''}</td>
        <td>${guidance_service_availed || ''}</td>
        <td>${contact_type || ''}</td>
        <td>${nature_of_concern || ''}</td>
        <td>${specific_concern || ''}</td>
        <td>${concern || ''}</td>
        <td>${intervention || ''}</td>
        <td>${status || ''}</td>
        <td>${remarks || ''}</td>
    `;
    document.getElementById("tableBody").appendChild(row);

    const cells = row.querySelectorAll("td");
    if (startEditing) editableCell(cells[1]);
    cellaNavigation(cells);
}

function cellaNavigation(cells) {
    cells.forEach((cell, index) => {
        cell.addEventListener("keydown", (event) => {
            let nextIndex = null;
            let currentRow = cell.parentElement;
            let allRows = Array.from(document.querySelectorAll("#tableBody tr"));
            let currentRowIndex = allRows.indexOf(currentRow);

            if (event.key === "Tab") {
                event.preventDefault();
                nextIndex = event.shiftKey ? index - 1 : index + 1;
            } else if (event.key === "Enter" || event.key === "ArrowRight") {
                nextIndex = index + 1;
            } else if (event.key === "ArrowLeft") {
                nextIndex = index - 1;
            } else if (event.key === "ArrowDown") {
                event.preventDefault();
                if (currentRowIndex < allRows.length - 1) {
                    let nextRow = allRows[currentRowIndex + 1];
                    let nextCell = nextRow.children[index];
                    if (nextCell) editableCell(nextCell);
                }
            } else if (event.key === "ArrowUp") {
                event.preventDefault();
                if (currentRowIndex > 0) {
                    let prevRow = allRows[currentRowIndex - 1];
                    let prevCell = prevRow.children[index];
                    if (prevCell) editableCell(prevCell);
                }
            }

            if (nextIndex !== null && nextIndex >= 0 && nextIndex < cells.length) {
                editableCell(cells[nextIndex]);
            }
        });
    });
}

function populateTable() {
    // lol
    searchStudent();
}

function saveChanges() {
    const tableBody = document.getElementById('tableBody');
    const rows = tableBody.querySelectorAll('tr');

    const data = Array.from(rows).map(row => {
        const cells = row.querySelectorAll('td');
        return Array.from(cells).map(cell => {
            let value = cell.innerText;
            return value === "" ? null : value;
        });
    });

    fetch('/saveChanges', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

function searchStudent(searchQuery = null) {
    const searchBar = document.getElementById('searchBar');
    if (searchQuery !== null) searchBar.value = searchQuery;

    const searchInput = searchBar.value.trim().toLowerCase();

    fetch(`/searchStudentData?q=${encodeURIComponent(searchInput)}`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch student data');
            return response.json();
        })
        .then(data => {
            const dataTableRow = document.getElementById('tableBody');
            dataTableRow.innerHTML = '';

            if (data.length === 0 && searchInput !== '') {
                dataTableRow.innerHTML = '<tr><td colspan="13" id="notFound">No data found.</td></tr>';
                return;
            }

            data.forEach(item => {
                addRow(item.id, item.date, item.student_id, item.level, item.program, item.guidance_service_availed, item.contact_type, item.nature_of_concern, item.specific_concern, item.concern, item.intervention, item.status, item.remarks, false);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            const dataTableRow = document.getElementById('tableBody');
            dataTableRow.innerHTML = '<tr><td colspan="13">Failed to load data. Please try again later.</td></tr>';
        });
}

function handleQRScanURL() {
    const url = new URLSearchParams(window.location.search);
    const searchQuery = url.get('search');
    if (searchQuery) {
        document.getElementById('searchBar').value = searchQuery;
        searchStudent(searchQuery);
        document.getElementById('searchBar').focus();
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
    document.getElementById('searchBar').addEventListener('input', () => searchStudent());
    document.getElementById('searchBar').addEventListener('keypress', (event) => {
        if (event.key === 'Enter') searchStudent();
    });
    document.getElementById('searchForm').addEventListener('submit', (event) => event.preventDefault());
    document.getElementById('qrCodeScanIcon').addEventListener('click', openQrScannerModal);
    document.getElementById('closeQrScannerModalTitle').addEventListener('click', closeQrScannerModal);
    document.getElementById('closeQrScannerModalFooter').addEventListener('click', closeQrScannerModal);
    document.getElementById('addRowButton').addEventListener('click', () => addRow());

    // tableBody
    document.querySelector('#tableBody').addEventListener('dblclick', (event) => {
        if (event.target.tagName === 'TD' && event.target.id !== 'notEditable') editableCell(event.target);
    });
}

let html5QrCode;

document.addEventListener('DOMContentLoaded', () => {
    populateTable();
    searchEventListener();
    handleQRScanURL();
});