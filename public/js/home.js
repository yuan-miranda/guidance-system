// function addRow(id = null, date = null, student_id = null, level = null, program = null, guidance_service_availed = null, contact_type = null, nature_of_concern = null, specific_concern = null, concern = null, intervention = null, status = null, remarks = null, focus = true) {
//     const row = document.createElement("tr");
//     const nextRowCount = document.querySelectorAll("#tableBody tr").length + 1;
//     row.innerHTML = `
//         <td id="notEditable">${id || nextRowCount}</td>
//         <td contenteditable="true">${date || ''}</td>
//         <td contenteditable="true">${student_id || ''}</td>
//         <td contenteditable="true">${level || ''}</td>
//         <td contenteditable="true">${program || ''}</td>
//         <td contenteditable="true">${guidance_service_availed || ''}</td>
//         <td contenteditable="true">${contact_type || ''}</td>
//         <td contenteditable="true">${nature_of_concern || ''}</td>
//         <td contenteditable="true">${specific_concern || ''}</td>
//         <td contenteditable="true">${concern || ''}</td>
//         <td contenteditable="true">${intervention || ''}</td>
//         <td contenteditable="true">${status || ''}</td>
//         <td contenteditable="true">${remarks || ''}</td>
//     `;
//     document.getElementById("tableBody").appendChild(row);

//     const cells = row.querySelectorAll("td");
//     cellNav(cells);

//     if (cells.length > 1 && focus) cells[1].focus();
// }

function setTableRows(data) {
    const tableBody = document.getElementById("tableBody");
    tableBody.innerHTML = '';

    data.forEach(row => {
        addRow(row, false);
    });
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
    // await search('');
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
            addRow(item, false);
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

    // file dropdown listener using /display
    document.getElementById('fileDropdown').addEventListener('change', async (event) => {
        const search = event.target.value;
        if (!search) return;
        try {
            const response = await fetch(`/display?search=${search}`);
            if (!response.ok) console.error(await response.text());

            const data = await response.json();
            setTableRows(data);
        } catch (error) {
            console.error('Error:', error);
        }
    });
}

let html5QrCode;

document.addEventListener('DOMContentLoaded', async () => {
    searchEventListener();
    await populateTable();
    handleQRScanURL();
});