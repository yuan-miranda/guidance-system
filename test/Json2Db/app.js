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

        // clean json data
        sheetData = sheetData.map((row) => {
            return {
                segment: row["Segment"],
                county: row["Country"],
                product: row[" Product "]?.trim(),
                discount_band: row[" Discount Band "]?.trim(),
                units_sold: parseFloat(row["Units Sold"]),
                manufacturing_price: parseFloat(row[" Manufacturing Price "]),
                sale_price: parseFloat(row[" Sale Price "]),
                gross_sales: parseFloat(row[" Gross Sales "]),
                discounts: parseFloat(row[" Discounts "]),
                sales: parseFloat(row["  Sales "]),
                cogs: parseFloat(row[" COGS "]),
                profit: parseFloat(row[" Profit "]),
                date: getJsDateFromExcel(row["Date"]),
                month_number: parseInt(row["Month Number"]),
                month_name: row[" Month Name "]?.trim(),
                year: parseInt(row["Year"])
            }
        });

        // insert data to db
        const query = `
            INSERT INTO FinancialSample (
                segment, country, product, discount_band, units_sold, manufacturing_price, sale_price, gross_sales, discounts, sales, cogs, profit, date, month_number, month_name, year
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
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