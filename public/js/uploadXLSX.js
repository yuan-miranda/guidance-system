// async function jsonFormSubmit(event) {
//     event.preventDefault();

//     const jsonFormInput = document.getElementById("jsonInput").value;

//     try {
//         const response = await fetch("/convert", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             body: jsonFormInput,
//         });
//         if (response.ok) {
//             alert("JSON converted to .xlsx");
//             const blob = await response.blob();
//             const url = URL.createObjectURL(blob);
//             const a = document.createElement("a");
//             a.href = url;
//             a.download = "converted.xlsx";
//             a.click();
//             a.remove();
//         } else {
//             throw new Error("Failed to convert JSON to .xlsx");
//         }
//     } catch (error) {
//         console.error(error);
//     }
// }

function firstRadioChecked() {
    document.querySelectorAll('input[name="spreadsheetRadios"]').forEach(radio => radio.checked = false);
    document.getElementById('infoSpreadsheet').checked = true;
}

function openUploadXLSXModal() {
    if (Dropzone.instances.length > 0) Dropzone.instances.forEach((dropzone) => dropzone.destroy());
    firstRadioChecked();

    const uploadXLSXDiscardButton = document.getElementById("uploadXLSXDiscardButton");
    const uploadXLSXUploadButton = document.getElementById("uploadXLSXUploadButton");
    uploadXLSXDiscardButton.disabled = true;
    uploadXLSXUploadButton.disabled = true;

    dropzone = new Dropzone("#uploadDropzone", {
        url: "/upload",
        paramName: "file",
        maxFiles: 1,
        maxFilesize: 4,
        acceptedFiles: ".xlsx,.xls",
        dictDefaultMessage: "Drop .xlsx or .xls file here to upload",
        addRemoveLinks: true,
        dictRemoveFile: "Remove",
        autoProcessQueue: false,
        previewsContainer: "#previews",
        previewTemplate: `
            <div class="dz-preview dz-file-preview">
                <div class="dz-details" style="display: flex; justify-content: space-between;">
                    <span data-dz-name></span>
                    <span data-dz-size></span>
                </div>
            </div>
        `,
        init: function () {
            const dzMessage = document.querySelector("#uploadDropzone .dz-message");
            this.on("addedfile", function (file) {
                if (!file.name.match(/\.(xls|xlsx)$/i)) {
                    dropzone.removeFile(file);
                    alert("Only .xls or .xlsx files are allowed.");
                    return;
                }
                dzMessage.textContent = "File added";
                uploadXLSXDiscardButton.disabled = false;
                uploadXLSXUploadButton.disabled = false;
                if (dropzone.files.length > 1) dropzone.removeFile(dropzone.files[0]);
            });
            this.on("dragenter", function (file) {
                dzMessage.textContent = "Drop the file to upload";
            });
            this.on("dragleave", function (event) {
                if (!event.relatedTarget || !event.relatedTarget.closest("#uploadDropzone")) {
                    dzMessage.textContent = "Drop .xlsx or .xls file here to upload";
                }
            });
            this.on("removedfile", function () {
                if (dropzone.files.length === 0) {
                    uploadXLSXDiscardButton.disabled = true;
                    uploadXLSXUploadButton.disabled = true;
                    dzMessage.textContent = "Drop .xlsx or .xls file here to upload";
                }
            });
        },
    });
}

function closeUploadXLSXModal() {
    dropzone.removeAllFiles(true);
    firstRadioChecked();
}

function modalEventListener() {
    document.getElementById("uploadXLSXModal").addEventListener("shown.bs.modal", openUploadXLSXModal);
    document.getElementById("uploadXLSXModal").addEventListener("hidden.bs.modal", closeUploadXLSXModal);
    document.getElementById("uploadXLSXDiscardButton").addEventListener("click", () => dropzone.removeAllFiles(true));
}

let dropzone;

document.addEventListener('DOMContentLoaded', () => {
    modalEventListener();
});