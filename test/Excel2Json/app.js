import express from 'express';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs from 'fs';
const app = express();
const port = 3000;
import multer from 'multer';
import xlsx from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const date = new Date();
        cb(null, `${date.toISOString().split("T")[0]}-${file.originalname}`);
    },
});

const upload = multer({ storage });

app.use(express.static(join(__dirname, 'static')));
app.use("/node_modules", express.static("node_modules"));

app.get('/', (req, res) => {
    res.sendFile("static/html/index.html", { root: __dirname });
});

app.post("/upload", upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).send("Please upload a file");
    try {
        const filePath = path.resolve(req.file.path);
        
        // readFile doesnt work for some reason, so I buffer read it instead
        // const workbook = xlsx.readFile(filePath);

        const fileBuffer = fs.readFileSync(filePath);
        const workbook = xlsx.read(fileBuffer, { type: "buffer" });

        const sheetName = workbook.SheetNames[0];
        const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        res.json(sheetData);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.post("/convert", express.json(), (req, res) => {
    if (!req.body || !Array.isArray(req.body)) return res.status(400).send("Please provide JSON data");
    try {
        const data = req.body;
        const worksheet = xlsx.utils.json_to_sheet(data);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");

        const fileBuffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });

        fs.writeFileSync(path.join(__dirname, 'uploads', `${Date.now()}-converted.xlsx`), fileBuffer);

        res.setHeader("Content-Disposition", "attachment; filename=converted.xlsx");
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.send(fileBuffer);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.listen(port, () => {
    console.log(`app listening at http://localhost:${port}`);
});