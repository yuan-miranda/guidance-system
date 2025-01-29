import express from 'express';
import { engine } from 'express-handlebars';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const dbPromise = open({
    filename: './database.db',
    driver: sqlite3.Database
});

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


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

const setup = async () => {
    const db = await dbPromise;
    await db.migrate({ migrationsPath: join(__dirname, 'migrations') });
    app.listen(3000, () => {
        console.log('Server is running on http://localhost:3000');
    });
};

setup();
