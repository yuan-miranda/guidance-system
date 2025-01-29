import express from 'express';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import xlsx from 'xlsx';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({ storage });

const dbPromise = open({
    filename: './database.db',
    driver: sqlite3.Database
});


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
        
        // res.json(sheetData);

        // code here for inserting data to database
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.listen(port, async () => {
    console.log(`app listening at http://localhost:${port}`);
    const db = await dbPromise;
    await db.migrate({ migrationsPath: join(__dirname, 'migrations') });
});