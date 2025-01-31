import express from 'express';
import { engine } from 'express-handlebars';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';
import qrcode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

const dbPromise = open({
    filename: './database.db',
    driver: sqlite3.Database
});

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use("/qr", express.static(join(__dirname, 'public/cdn/qr')));


app.get('/', async (req, res) => {  
    const db = await dbPromise;
    const home = await db.all('SELECT * FROM StudentData');
    res.render('home', { 
        title: 'Home',
        css: 'css/home.css',
        script: 'js/home.js',
        home
    });
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

app.get('/login', (req, res) => {
    res.render('login', { title: 'Login', css: 'css/login.css', script: 'js/login.js' });
});

app.get('/qrgen', (req, res) => {
    res.render('qrgen', { 
        title: 'QR Code Generator',
        css: 'css/qrgen.css',
        script: 'js/qrgen.js'
    });
});

app.get("/generate-qr", (req, res) => {
    const data = req.query.text;
    const url = `https://example.com/${data}`;

    qrcode.toFile(`public/cdn/qr/${data}.png`, url, {
        color: {
            dark: '#000000',
            light: '#ffffff'
        },
        width: 500,
        margin: 2
    }, (err, url) => {
        if (err) return res.status(500).send("Error generating QR code");
        res.json({ message: "QR code generated", url: `qr/${data}.png` });
    });
});

app.listen(port, async () => {
    console.log(`Server is running on http://localhost:${port}`);
    const db = await dbPromise;
    await db.migrate({ migrationsPath: join(__dirname, 'migrations') });
});