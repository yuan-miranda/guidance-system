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

function addColumn(referenceCell, position = "right") {
    if (!referenceCell) return;

    const columnIndex = Array.from(referenceCell.parentNode.children).indexOf(referenceCell);
    const tableHead = document.getElementById("tableHead");
    const tableBody = document.getElementById("tableBody");

    if (columnIndex === -1) return;

    const columnName = prompt("Enter column name:");
    if (!columnName) return;

    const newHeader = document.createElement("th");
    newHeader.innerText = columnName;

    const headerRow = tableHead.querySelector("tr");
    if (headerRow) {
        if (position === "left") headerRow.insertBefore(newHeader, referenceCell);
        else headerRow.insertBefore(newHeader, referenceCell.nextElementSibling);
    }

    Array.from(tableBody.querySelectorAll("tr")).forEach(row => {
        const newCell = document.createElement("td");
        newCell.contentEditable = true;
        newCell.innerText = "&nbsp;";
        row.insertBefore(newCell, row.children[columnIndex + 1]);
    });

    saveChanges();
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
        if (columns.length > 0) {
            const lastColumnName = columns[columns.length - 1].innerText.trim();
            data[lastColumnName] = null;
        }
    }

    const row = document.createElement("tr");
    row.innerHTML = Object.keys(data).map((key, index) => {
        if (key === "id") return `<td id="notEditable">${data[key] ?? nextRowCount}</td>`;
        return `<td contenteditable="true">${data[key] ?? '&nbsp;'}</td>`;
    }).join('');

    tableBody.appendChild(row);
    const cells = row.querySelectorAll("td");
    cellNav(cells);

    if (cells.length > 0 && focus) cells[0].focus();
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
        const downloadButton = document.getElementById('downloadFileButton');
        const deleteButton = document.getElementById('deleteFileButton');
        const addRowButton = document.getElementById('addRowButton');

        const searchBar = document.getElementById('searchBar');
        select.innerHTML = '';

        if (Array.isArray(data) && data.length > 0) {
            select.disabled = false;
            downloadButton.disabled = false;
            deleteButton.disabled = false;
            searchBar.disabled = false;
            addRowButton.disabled = false;

            downloadButton.removeEventListener('click', handleDownload);
            deleteButton.removeEventListener('click', handleDelete);
            addRowButton.removeEventListener('click', handleAddRowClick);

            downloadButton.addEventListener('click', handleDownload);
            deleteButton.addEventListener('click', handleDelete);
            addRowButton.addEventListener('click', handleAddRowClick);

            const lastSelectedFile = localStorage.getItem('selectedFile');

            data.forEach(file => {
                const option = document.createElement('option');
                option.value = file;
                option.text = file;
                select.appendChild(option);
            });

            if (lastSelectedFile && data.includes(lastSelectedFile)) select.value = lastSelectedFile;
            else select.value = data[0];

            select.dispatchEvent(new Event('change'));
        } else {
            select.disabled = true;
            downloadButton.disabled = true;
            deleteButton.disabled = true;
            searchBar.disabled = true;
            addRowButton.disabled = true;
        }
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
    } catch (error) {
        console.error('Error:', error);
    }
}

function removeRow(row) {
    if (!row) return;

    const tableBody = document.getElementById("tableBody");
    const rows = tableBody.querySelectorAll("tr");
    
    // if only one row, clear the row instead of deleting it
    if (rows.length === 1) {
        Array.from(row.children).forEach(cell => (cell.innerHTML = '&nbsp;'));
        saveChanges();
        return;
    }

    const rowIndex = Array.from(rows).indexOf(row);
    if (!confirm("Are you sure you want to delete this row?")) return;

    row.remove();
    if (rowIndex > -1) tableDataBuffer.splice(rowIndex, 1);

    saveChanges();
}

function removeColumn(cell) {
    if (!cell) return;

    const columnIndex = Array.from(cell.parentNode.children).indexOf(cell);
    const tableHead = document.getElementById("tableHead");
    const tableBody = document.getElementById("tableBody");
    const headerRow = tableHead.querySelector("tr");
    const totalColumns = headerRow ? headerRow.children.length : 0;

    if (columnIndex === -1) return;

    if (totalColumns === 1) {
        const newColumnName = prompt("You cannot delete the last column. Please enter a new name:");
        if (newColumnName) headerRow.children[0].innerText = newColumnName;
        Array.from(tableBody.querySelectorAll("tr")).forEach(row => row.children[0].innerHTML = "&nbsp;");
        saveChanges();
        return;
    }

    if (!confirm("Are you sure you want to delete this column?")) return;

    if (headerRow) headerRow.removeChild(headerRow.children[columnIndex]);
    Array.from(tableBody.querySelectorAll("tr")).forEach(row => row.removeChild(row.children[columnIndex]));

    saveChanges();
}


function createContextMenu() {
    const menu = document.createElement("div");
    menu.id = "contextMenu";
    menu.style.position = "absolute";
    menu.style.display = "none";
    menu.style.background = "white";
    menu.style.border = "1px solid #ccc";
    menu.style.boxShadow = "2px 2px 10px rgba(0,0,0,0.2)";
    menu.style.zIndex = "1000";
    menu.innerHTML = `
        <ul style="list-style: none; padding: 0.1em; margin: 0; cursor: pointer;">
            <li id="deleteRow" style="cursor: pointer; padding: 5px;">Delete Row</li>
            <li id="deleteColumn" style="cursor: pointer; padding: 5px;">Delete Column</li>
        </ul>
    `;
    document.body.appendChild(menu);

    let selectedCell = null;

    // show context menu on right click
    document.getElementById("tableBody").addEventListener("contextmenu", function (event) {
        event.preventDefault();
        selectedCell = event.target;

        if (selectedCell.tagName !== "TD") return;

        document.getElementById("headerContextMenu").style.display = "none";

        menu.style.display = "block";
        const menuWidth = menu.offsetWidth;
        const menuHeight = menu.offsetHeight;
        menu.style.display = "none";

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let left = event.pageX;
        let top = event.pageY;

        if (left + menuWidth > viewportWidth) left = viewportWidth - menuWidth - 10;
        if (top + menuHeight > viewportHeight) top = viewportHeight - menuHeight - 10;

        menu.style.top = `${top}px`;
        menu.style.left = `${left}px`;
        menu.style.display = "block";
    });

    menu.addEventListener("contextmenu", function (event) {
        event.preventDefault();
    });

    // hide context menu when clicking outside
    document.addEventListener("click", function () {
        menu.style.display = "none";
    });

    document.getElementById("deleteRow").addEventListener("click", function () {
        if (selectedCell) removeRow(selectedCell.closest("tr"));
        menu.style.display = "none";
    });

    document.getElementById("deleteColumn").addEventListener("click", function () {
        if (selectedCell) removeColumn(selectedCell);
        menu.style.display = "none";
    });
}

function createHeaderContextMenu() {
    const menu = document.createElement("div");
    menu.id = "headerContextMenu";
    menu.style.position = "absolute";
    menu.style.display = "none";
    menu.style.background = "white";
    menu.style.border = "1px solid #ccc";
    menu.style.boxShadow = "2px 2px 10px rgba(0,0,0,0.2)";
    menu.style.zIndex = "1000";
    menu.innerHTML = `
        <ul style="list-style: none; padding: 0.1em; margin: 0; cursor: pointer;">
            <li id="addColumnLeft" style="cursor: pointer; padding: 5px;">Add Column Left</li>
            <li id="addColumnRight" style="cursor: pointer; padding: 5px;">Add Column Right</li>
        </ul>
    `;
    document.body.appendChild(menu);

    let selectedHeader = null;

    document.getElementById("tableHead").addEventListener("contextmenu", function (event) {
        event.preventDefault();
        selectedHeader = event.target;

        if (selectedHeader.tagName !== "TH") return;

        document.getElementById("contextMenu").style.display = "none";

        menu.style.display = "block";
        const menuWidth = menu.offsetWidth;
        const menuHeight = menu.offsetHeight;
        menu.style.display = "none";

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let left = event.pageX;
        let top = event.pageY;

        if (left + menuWidth > viewportWidth) left = viewportWidth - menuWidth - 10;
        if (top + menuHeight > viewportHeight) top = viewportHeight - menuHeight - 10;

        menu.style.top = `${top}px`;
        menu.style.left = `${left}px`;
        menu.style.display = "block";
    });

    menu.addEventListener("contextmenu", function (event) {
        event.preventDefault();
    });

    // hide context menu when clicking outside
    document.addEventListener("click", function () {
        menu.style.display = "none";
    });

    document.getElementById("addColumnLeft").addEventListener("click", function () {
        if (selectedHeader) addColumn(selectedHeader, "left");
        menu.style.display = "none";
    });

    document.getElementById("addColumnRight").addEventListener("click", function () {
        if (selectedHeader) addColumn(selectedHeader, "right");
        menu.style.display = "none";
    });
}

function search(searchQuery = null) {
    const searchBar = document.getElementById('searchBar');
    if (searchQuery !== null) searchBar.value = searchQuery;

    const searchInput = searchBar.value.trim().toLowerCase();
    const rows = document.querySelectorAll("#tableBody tr");

    rows.forEach(row => {
        const cells = row.querySelectorAll("td");
        const match = Array.from(cells).some(cell => 
            cell.innerText && cell.innerText.toLowerCase().includes(searchInput)
        );
        row.style.display = match ? "" : "none";
    });
}

function handleQRScanURL() {
    const searchBar = document.getElementById('searchBar');
    const url = new URLSearchParams(window.location.search);
    const searchQuery = url.get('search');
    if (searchQuery) {
        searchBar.value = searchQuery;

        setTimeout(() => {
            search(searchQuery);
        }, 100);

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

async function handleDownload() {
    const filename = document.getElementById('fileDropdown').value;
    if (!filename) return;

    try {
        const response = await fetch(`/download?filename=${filename}`);
        if (!response.ok) return console.error('Failed to download file');

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error:', error);
    }
}

async function handleDelete() {
    const filename = document.getElementById('fileDropdown').value;
    if (!filename) return;

    if (confirm(`Are you sure you want to delete "${filename}"?`)) {
        try {
            const response = await fetch(`/delete?filename=${filename}`);
            if (!response.ok) return console.error('Failed to delete file');
            window.location.href = '/';
        } catch (error) {
            console.error('Error:', error);
        }
    }
}

function handleAddRowClick() {
    search('');
    addRow();
}

function searchEventListener() {
    let searchTimeout;
    document.addEventListener('keydown', keyEventListener);
    document.getElementById('searchBar').addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => search(), 1000);
    });
    document.getElementById('searchForm').addEventListener('submit', (event) => event.preventDefault());
    document.getElementById('qrCodeScanIcon').addEventListener('click', openQrScannerModal);
    document.getElementById('closeQrScannerModalTitle').addEventListener('click', closeQrScannerModal);
    document.getElementById('closeQrScannerModalFooter').addEventListener('click', closeQrScannerModal);
    document.querySelector("#tableBody").addEventListener("blur", async (event) => {
        if (event.target.tagName === "TD" && event.target.hasAttribute("contenteditable")) await saveChanges();
    }, true);
    document.getElementById('fileDropdown').addEventListener('change', async (event) => {
        const search = event.target.value;
        if (search) await displayTable(search);
        localStorage.setItem('selectedFile', search);
    });
}

let html5QrCode;
let tableDataBuffer = [];

document.addEventListener('DOMContentLoaded', async () => {
    searchEventListener();
    await populateTable();
    handleQRScanURL();

    createContextMenu();
    createHeaderContextMenu();
});