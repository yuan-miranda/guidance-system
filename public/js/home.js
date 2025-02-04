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

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && document.getElementById('addDataModal').style.display === 'block') {
        closeAddModal();
    }
    if (event.key === 'Escape' && document.getElementById('qrScannerModal').style.display === 'block') {
        closeQrScannerModal();
    }
});

function openAddModal() {
    document.getElementById('addDataModal').style.display = 'block';
}
function closeAddModal() {
    document.getElementById('addDataModal').style.display = 'none';
}

function openQrScannerModal() {
    document.getElementById('qrScannerModal').style.display = 'block';
}
function closeQrScannerModal() {
    document.getElementById('qrScannerModal').style.display = 'none';
}

function keyEventListener(event) {
    if (event.ctrlKey && event.key === 'k') {
        event.preventDefault();
        document.querySelector('input[type="search"]').focus();
    }
    if (event.key === 'Escape') {
        closeAddModal();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('keydown', keyEventListener);
});