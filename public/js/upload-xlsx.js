async function jsonFormSubmit(event) {
    event.preventDefault();

    const jsonFormInput = document.getElementById("jsonInput").value;

    try {
        const response = await fetch("/convert", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: jsonFormInput,
        });
        if (response.ok) {
            alert("JSON converted to .xlsx");
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "converted.xlsx";
            a.click();
            a.remove();
        } else {
            throw new Error("Failed to convert JSON to .xlsx");
        }
    } catch (error) {
        console.error(error);
    }
}