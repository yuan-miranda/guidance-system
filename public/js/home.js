function setTableRows(data) {
    const tableBody = document.getElementById("tableBody");
    tableBody.innerHTML = '';

    data.forEach(row => addRow(row, false));
}

async function displayTable(search) {
    try {
        const response = await fetch(`/display?search=${search}`);
        if (!response.ok) console.error(await response.text());

        const data = await response.json();
        tableDataBuffer = data;
        setTableRows(data);
    } catch (error) {
        console.error('Error:', error);
    }
}

function addRow(data = {}, focus = true) {
    const tableHead = document.getElementById("tableHead");
    const tableBody = document.getElementById("tableBody");
    const lastRow = document.querySelector("#tableBody tr:last-child");
    const nextRowCount = lastRow ? (parseInt(lastRow.querySelector("td")?.innerText) || 0) + 1 : 1;
    let columns = tableHead.querySelectorAll("th");

    const dataKeys = Object.keys(data);
    if (dataKeys.length > 0 && dataKeys.length !== columns.length) {
        // create or update table header
        tableHead.innerHTML = `
            <tr>
                ${dataKeys.map(key => `<th scope="col">${key}</th>`).join('')}
            </tr>
        `;
        columns = tableHead.querySelectorAll("th");
    }

    // create a blank row if no data is provided (add row clicked)
    if (dataKeys.length === 0) {
        data = Object.fromEntries(Array.from(columns).map((column => [column.innerText.trim(), null])));
    }

    const row = document.createElement("tr");
    row.innerHTML = Object.keys(data).map((key, index) => {
        if (key === "id") return `<td id="notEditable">${data[key] ?? nextRowCount}</td>`;
        return `<td contenteditable="true">${data[key] ?? ''}</td>`;
    }).join('');

    tableBody.appendChild(row);
    const cells = row.querySelectorAll("td");
    cellNav(cells);

    if (cells.length > 1 && focus) cells[1].focus();
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
    await populateFileDropdown();
    search('');
}

async function populateFileDropdown() {
    try {
        const response = await fetch('/ls');
        const data = await response.json();

        const select = document.getElementById('fileDropdown');
        select.innerHTML = '';

        data.forEach(file => {
            const option = document.createElement('option');
            option.value = file;
            option.text = file;
            select.appendChild(option);
        });

        // trigger change event to load the first file
        if (data.length > 0) select.dispatchEvent(new Event('change'));
    } catch (error) {
        console.error('Error:', error);
    }
}

async function saveChanges() {
    const rows = document.querySelectorAll('#tableBody tr');
    const headers = Array.from(document.querySelectorAll('#tableHead th')).map(th => th.innerText.trim());

    const data = Array.from(rows).map(row => {
        const cells = row.querySelectorAll('td');
        let rowData = {};
        cells.forEach((cell, index) => {
            rowData[headers[index]] = cell.innerText === "" ? null : cell.innerText;
        });
        return rowData;
    });

    tableDataBuffer = data;

    try {
        const response = await fetch('/savechanges', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filename: document.getElementById('fileDropdown').value,
                sheetName: 'Sheet1',
                data
            })
        });

        if (!response.ok) return console.error('Failed to save changes');

        const result = await response.json();
        console.log(result);
    } catch (error) {
        console.error('Error:', error);
    }
}

function search(searchQuery = null) {
    const searchBar = document.getElementById('searchBar');
    if (searchQuery !== null) searchBar.value = searchQuery;

    const searchInput = searchBar.value.trim().toLowerCase();
    const dataTableRow = document.getElementById('tableBody');

    if (!Array.isArray(tableDataBuffer) || tableDataBuffer.length === 0) {
        dataTableRow.innerHTML = '<tr><td colspan="100%">No data available.</td></tr>';
        return;
    }

    const filteredData = tableDataBuffer.filter(row => 
        Object.values(row).some(value => value && value.toString().toLowerCase().includes(searchInput))
    );

    dataTableRow.innerHTML = '';

    if (filteredData.length === 0 && searchInput !== '') {
        dataTableRow.innerHTML = '<tr><td colspan="100%" id="notFound">No data found.</td></tr>';
        return;
    }

    filteredData.forEach(item => addRow(item, false));
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
    document.getElementById('addRowButton').addEventListener('click',  () => {
        search('');
        addRow();
    });
    document.querySelector("#tableBody").addEventListener("blur", async (event) => {
        if (event.target.tagName === "TD" && event.target.hasAttribute("contenteditable")) await saveChanges();
    }, true);
    document.getElementById('fileDropdown').addEventListener('change', async (event) => {
        const search = event.target.value;
        if (search) await displayTable(search);
    });
}

let html5QrCode;
let tableDataBuffer = [];

document.addEventListener('DOMContentLoaded', async () => {
    searchEventListener();
    await populateTable();
    handleQRScanURL();
});