import express from 'express';
import { engine } from 'express-handlebars';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';
import qrcode from 'qrcode';
import multer from 'multer';

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

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use("/node_modules", express.static(join(__dirname, 'node_modules')));
app.use("/qr", express.static(join(__dirname, 'public/cdn/qr')));
app.use("/background", express.static(join(__dirname, 'public/cdn/background')));

app.get('/', async (req, res) => {
    const db = await dbPromise;
    const home = await db.all('SELECT * FROM StudentData');
    res.render('home', {
        title: 'Home',
        styles: ['/node_modules/bootstrap/dist/css/bootstrap.min.css', 'css/BASE.css', 'css/home.css'],
        scripts: ['/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js', '/node_modules/html5-qrcode/html5-qrcode.min.js', 'js/home.js'],
        home
    });
});

app.get('/login', (req, res) => {
    res.render('login', {
        title: 'Login',
        styles: ['css/login.css'],
        scripts: ['js/login.js']
    });
});

app.get('/qrgen', (req, res) => {
    res.render('qrgen', {
        title: 'QR Code Generator',
        styles: ['/node_modules/bootstrap/dist/css/bootstrap.min.css', 'css/BASE.css', 'css/qrgen.css'],
        scripts: ['/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js', 'js/qrgen.js']
    });
});

app.get("/generate-qr", (req, res) => {
    const data = req.query.text;
    if (!data) {
        return res.status(400).send("Text query parameter is required");
    }

    const sanitizedData = data.replace(/[\/\\?%*:|"<>]/g, '-');
    const url = `${req.protocol}://${req.get('host')}/?search=${encodeURIComponent(data)}`
    console.log(url)

    // console.log(req.protocol)
    // console.log(req.get('host'))

    qrcode.toFile(`public/cdn/qr/${sanitizedData}.png`, url, {
        color: {
            dark: '#000',
            light: '#fff'
        },
        width: 500,
        margin: 2
    }, (err) => {
        if (err) {
            console.error("Error generating QR code:", err);
            return res.status(500).send("Error generating QR code");
        }
        res.json({ message: "QR code generated", url: `qr/${sanitizedData}.png` });
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

app.listen(port, async () => {
    console.log(`Server is running on http://localhost:${port}`);
    const db = await dbPromise;
    await db.migrate({ migrationsPath: join(__dirname, 'migrations') });
});