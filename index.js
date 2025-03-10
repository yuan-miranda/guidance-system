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
        cb(null, file.originalname);
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

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use("/node_modules", express.static(join(__dirname, 'node_modules')));
app.use("/public", express.static(join(__dirname, 'public')));
app.use("/qr", express.static(join(__dirname, 'public/cdn/qr')));
app.use("/background", express.static(join(__dirname, 'public/cdn/background')));

// home
app.get('/', async (req, res) => {
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
            'css/generateQR.css',
            'css/uploadXLSX.css'
        ],
        nodeModules: [
            '/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
            '/node_modules/html5-qrcode/html5-qrcode.min.js',
            '/node_modules/dropzone/dist/dropzone-min.js',
        ],
        scripts: [
            'js/home.js',
            'js/generateQR.js',
            'js/uploadXLSX.js'
        ],
    });
});

app.post('/savechanges', async (req, res) => {
    const { filename, sheetName, data } = req.body;
    if (!filename) return res.status(400).send("Filename is required");
    if (!sheetName) return res.status(400).send("Sheet name is required");
    if (!data || !Array.isArray(data)) return res.status(400).send("JSON data is required");

    try {
        const worksheet = xlsx.utils.json_to_sheet(data);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);

        const fileBuffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
        fs.writeFileSync(path.join(__dirname, 'public/cdn/uploads', filename), fileBuffer);
        console.log("Changes saved successfully");
        res.json({ message: "Changes saved successfully" });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// generateQR
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

app.get('/ls', (req, res) => {
    // list all files in /public/cdn/uploads
    const files = fs.readdirSync(path.join(__dirname, 'public/cdn/uploads'));
    res.json(files);
});

app.post('/upload', upload.single("file"), (req, res) => {
    try {
        res.status(200).send("File uploaded successfully");
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.get('/display', async (req, res) => {
    const { search } = req.query;
    if (!search) return res.status(400).send("Please provide a search query");

    try {
        const files = fs.readdirSync(path.join(__dirname, 'public/cdn/uploads'));
        const file = files.find(f => f.includes(search));
        if (!file) return res.status(404).send("File not found");
    
        const filePath = path.join(__dirname, 'public/cdn/uploads', file);
        const fileBuffer = fs.readFileSync(filePath);
        const workbook = xlsx.read(fileBuffer, { type: "buffer" });
    
        const sheetName = workbook.SheetNames[0];

        const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        res.json(sheetData);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.get('/download', async (req, res) => {
    const { filename } = req.query;
    if (!filename) return res.status(400).send("Filename is required");

    try {
        const filePath = path.join(__dirname, 'public/cdn/uploads', filename);
        res.download(filePath);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.get('/delete', async (req, res) => {
    const { filename } = req.query;
    if (!filename) return res.status(400).send("Filename is required");

    try {
        const filePath = path.join(__dirname, 'public/cdn/uploads', filename);
        fs.unlinkSync(filePath);
        res.json({ message: "File deleted successfully" });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.listen(port, async () => {
    console.log(`Server is running on http://localhost:${port}`);
    const db = await dbPromise;
    await db.migrate({ migrationsPath: join(__dirname, 'migrations') });
});