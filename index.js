import express from 'express';
import { engine } from 'express-handlebars';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';
import qrcode from 'qrcode';
import multer from 'multer';
import fs from 'fs';
import xlsx from 'xlsx';

const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/cdn/uploads");
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

app.engine('handlebars', engine({
    helpers: {
        include: (path) => fs.readFileSync(join(__dirname, path), 'utf-8'),
    },
}));
app.set('view engine', 'handlebars');
app.set('views', join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use("/node_modules", express.static(join(__dirname, 'node_modules')));
app.use("/qr", express.static(join(__dirname, 'public/cdn/qr')));
app.use("/background", express.static(join(__dirname, 'public/cdn/background')));

// home
app.get('/', async (req, res) => {
    const db = await dbPromise;
    const home = await db.all('SELECT * FROM StudentData');
    res.render('home', {
        title: 'Home',
        beforeBody: [
            'views/partials/HEADER.handlebars',
            'views/partials/MODAL.handlebars'
        ],
        afterBody: [],
        styles: [
            '/node_modules/bootstrap/dist/css/bootstrap.min.css',
            '/node_modules/dropzone/dist/dropzone.css',
            'css/BASE.css',
            'css/home.css',
            'css/qrgen.css',
            'css/upload-xlsx.css'
        ],
        scripts: [
            '/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
            '/node_modules/html5-qrcode/html5-qrcode.min.js',
            '/node_modules/dropzone/dist/dropzone-min.js',
            'js/home.js',
            'js/qrgen.js',
            'js/upload-xlsx.js'
        ],
        home
    });
});

app.post('/addStudentData', upload.single("file"), async (req, res) => {
    const { student_id, level, program, guidance_service_availed, contact_type, nature_of_concern, specific_concern, concern, intervention, status, remarks } = req.body;
    const db = await dbPromise;

    const date = new Date().toISOString().split('T')[0];
    await db.run(`
        INSERT INTO StudentData (date, student_id, level, program, guidance_service_availed, contact_type, nature_of_concern, specific_concern, concern, intervention, status, remarks) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [date, student_id, level, program, guidance_service_availed, contact_type, nature_of_concern, specific_concern, concern, intervention, status, remarks]);
    res.json({ message: 'Data added successfully' });
});

app.get('/searchStudentData', async (req, res) => {
    const { q } = req.query;
    const db = await dbPromise;
    const data = await db.all(
        `SELECT * FROM StudentData 
         WHERE date LIKE ?
         OR student_id LIKE ?
         OR level LIKE ?
         OR program LIKE ?
         OR guidance_service_availed LIKE ?
         OR contact_type LIKE ?
         OR nature_of_concern LIKE ?
         OR specific_concern LIKE ?
         OR concern LIKE ?
         OR status LIKE ?
         OR intervention LIKE ?
         OR remarks LIKE ?`,
        Array(12).fill(`%${q}%`)
    );
    res.json(data);
});

// qrgen
app.get("/generate-qr", (req, res) => {
    const data = req.query.text;
    if (!data) {
        return res.status(400).send("Text query parameter is required");
    }

    const sanitizedData = data.replace(/[\/\\?%*:|"<>]/g, '-');
    const url = `${req.protocol}://${req.get('host')}/?search=${encodeURIComponent(data)}`

    qrcode.toFile(`public/cdn/qr/${sanitizedData}.png`, url, {
        color: {
            dark: '#000',
            light: '#fff'
        },
        width: 500,
        margin: 2
    }, (err) => {
        if (err) {
            return res.status(500).send("Error generating QR code");
        }
        res.json({ message: "QR code generated", url: `qr/${sanitizedData}.png` });
    });
});

app.delete("/delete-qr", (req, res) => {
    const file = req.query.file;
    if (!file) {
        return res.status(400).send("File query parameter is required");
    }

    const filePath = join(__dirname, 'public/cdn', file);
    fs.unlink(filePath, (err) => {
        if (err) {
            return res.status(500).send('Error deleting file');
        }
        res.send('File deleted successfully');
    });
});

// upload-xlsx
app.post("/upload", upload.single("file"), (req, res) => {
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

        fs.writeFileSync(path.join(__dirname, 'public/cdn/uploads', `${Date.now()}-converted.xlsx`), fileBuffer);

        res.setHeader("Content-Disposition", "attachment; filename=converted.xlsx");
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.send(fileBuffer);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.listen(port, async () => {
    console.log(`Server is running on http://localhost:${port}`);
    const db = await dbPromise;
    await db.migrate({ migrationsPath: join(__dirname, 'migrations') });
});