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
        const date = new Date();
        cb(null, `${date.toISOString().split("T")[0]}-${file.originalname}`);
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

// https://gist.github.com/christopherscott/2782634
function getJsDateFromExcel(excelDate) {
    return new Date((excelDate - (25567 + 1))*86400*1000).toISOString().split("T")[0];
}

app.post("/upload", upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).send("Please upload a file");
    try {
        const db = await dbPromise;
        const filePath = path.resolve(req.file.path);
        
        // readFile doesnt work for some reason, so I buffer read it instead
        // const workbook = xlsx.readFile(filePath);

        const fileBuffer = fs.readFileSync(filePath);
        const workbook = xlsx.read(fileBuffer, { type: "buffer" });

        const sheetName = workbook.SheetNames[0];
        var sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        // CounselingSchema
        sheetData = sheetData.map((row) => {
            return {
                date: getJsDateFromExcel(row["Date"]),
                student_id: row["Student #"],
                level: row["Level"],
                program: row["Program"],
                guidance_service_availed: row["Guidance Service Availed"],
                contact_type: row["Contact Type"],
                nature_of_concern: row["Nature of Concern"],
                specific_concern: row["Specific Concern"],
                concern: row["Concern"],
                intervention: row["Intervention"],
                status: row["Status"],
                remarks: row["Remarks"]
            }
        });

        const queryCounselingSchema = `
            INSERT INTO CounselingSchema (
                date, student_id, level, program, guidance_service_availed, contact_type, nature_of_concern, specific_concern, concern, intervention, status, remarks
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;

        // InformationSchema
        sheetData = sheetData.map((row) => {
            return {
                date: getJsDateFromExcel(row["Date"]),
                level: row["Level"],
                program: row["Program"],
                seminar_workshop_title: row["Seminar/Workshop Title"],
                evaluation_result: row["Evaluation Result"],
                documentation: row["Documentation"],
                fb_page_post: row["FB Page Post"]
            }
        });

        const queryInformationSchema = `
            INSERT INTO InformationSchema (
                date, level, program, seminar_workshop_title, evaluation_result, documentation, fb_page_post
            ) VALUES (?, ?, ?, ?, ?, ?, ?);
        `;
        
        // query db
        for(const row of sheetData) {
            await db.run(query, Object.values(row));
        }
        
        console.log("File uploaded to database successfully");
        res.status(200).send("File uploaded to database successfully");
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.listen(port, async () => {
    console.log(`app listening at http://localhost:${port}`);
    const db = await dbPromise;
    await db.migrate({ migrationsPath: join(__dirname, 'migrations') });
});