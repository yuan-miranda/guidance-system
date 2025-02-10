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

function openDropzone() {
    if (Dropzone.instances.length > 0) Dropzone.instances.forEach((dropzone) => dropzone.destroy());

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
            // keep only the latest file
            // comment to allow multiple file uploads
            // (add toast to notify user later)
            const dzMessage = document.querySelector("#uploadDropzone .dz-message");
            this.on("addedfile", function (file) {
                dzMessage.textContent = "File added";
                if (dropzone.files.length > 1) dropzone.removeFile(dropzone.files[0]);
            });
            this.on("dragenter", function () {
                dzMessage.textContent = "Drop the file to upload";
            });
            this.on("dragleave", function (event) {
                if (!event.relatedTarget || !event.relatedTarget.closest("#uploadDropzone")) {
                    dzMessage.textContent = "Drop .xlsx or .xls file here to upload";
                }
            });
            this.on("removedfile", function () {
                dzMessage.textContent = "Drop .xlsx or .xls file here to upload";
            });
        },
    });
}

function closeDropzone() {
    dropzone.removeAllFiles(true);

    // for some reason, the radios are not reset when the modal is closed, cause
    // it only makes modal hidden not destroyed on close

    document.querySelectorAll('input[name="spreadsheetRadios"]').forEach(radio => radio.checked = false);
    document.getElementById('infoSpreadsheet').checked = true;
}


function eventListeners() {
    document.getElementById("uploadXLSXModal").addEventListener("shown.bs.modal", openDropzone);
    document.getElementById("uploadXLSXModal").addEventListener("hidden.bs.modal", closeDropzone);
}

let dropzone;

document.addEventListener('DOMContentLoaded', () => {
    eventListeners();
});