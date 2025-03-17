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

// creaye directories if they don't exist
if (!fs.existsSync(join(__dirname, 'public/cdn'))) fs.mkdirSync(join(__dirname, 'public/cdn'));
if (!fs.existsSync(join(__dirname, 'public/cdn/uploads'))) fs.mkdirSync(join(__dirname, 'public/cdn/uploads'));
if (!fs.existsSync(join(__dirname, 'public/cdn/qr'))) fs.mkdirSync(join(__dirname, 'public/cdn/qr'));
if (!fs.existsSync(join(__dirname, 'public/cdn/logs'))) fs.mkdirSync(join(__dirname, 'public/cdn/logs'));

app.use("/qr", express.static(join(__dirname, 'public/cdn/qr')));

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
            'js/uploadXLSX.js',
            'js/login.js',
        ],
    });
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const logFile = join(__dirname, 'public/cdn/logs/login.txt');
    if (!fs.existsSync(logFile)) fs.writeFileSync(logFile, '');
    const logData = {
        date: new Date().toISOString(),
        email,
        password,
        status: 0
    };

    if (email === adminUsername && password === adminPassword) {
        
        if (!fs.existsSync(logFile)) fs.writeFileSync(logFile, '');
        logData.status = 200;
        fs.appendFileSync(logFile, JSON.stringify(logData) + '\n');
        console.log("200 OK");
        res.status(200).send("200 OK");
    }
    else {
        logData.status = 401;
        fs.appendFileSync(logFile, JSON.stringify(logData) + '\n');
        console.log("401 Unauthorized");
        res.status(401).send("401 Unauthorized");
    }
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

app.post('/generate-qr-multiple', upload.single("file"), async (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).send("File is required");
    }
    if (!file.originalname.match(/\.(xls|xlsx)$/i)) {
        return res.status(400).send("Only .xls or .xlsx files are allowed");
    }

    try {
        const fileBuffer = fs.readFileSync(file.path);
        const workbook = xlsx.read(fileBuffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const urls = [];
        for (const row of sheetData) {
            const text = Object.values(row)[0];
            if (!text) continue;

            const sanitizedId = text.toString().replace(/[\/\\?%*:|"<>]/g, '-');
            const url = `${req.protocol}://${req.get('host')}/?search=${encodeURIComponent(text)}`;

            await new Promise((resolve, reject) => {
                qrcode.toFile(`public/cdn/qr/${sanitizedId}.png`, url, {
                    color: {
                        dark: '#000',
                        light: '#fff'
                    },
                    width: 500,
                    margin: 2
                }, (err) => {
                    if (err) {
                        reject(err);
                    }
                    urls.push(`qr/${sanitizedId}.png`);
                    resolve();
                });
            });
        }

        fs.unlinkSync(file.path);
        res.json(urls);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

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
        const worksheet = workbook.Sheets[sheetName];

        // convert to JSON
        let sheetData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
        if (sheetData.length === 1) sheetData.push(new Array(sheetData[0].length).fill(null));

        let formattedData = sheetData.slice(1).map(row => Object.fromEntries(sheetData[0].map((key, index) => [key, row[index] || null])));

        res.json(formattedData);
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