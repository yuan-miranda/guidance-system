import express from 'express';
import { engine } from 'express-handlebars';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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

app.get('/', async (req, res) => {
    const db = await dbPromise;
    const home = await db.all('SELECT * FROM Chairs');
    res.render('home', { 
        title: 'Home',
        home
    });
});

const setup = async () => {
    const db = await dbPromise;
    await db.migrate({ migrationsPath: join(__dirname, 'migrations') });
    app.listen(3000, () => {
        console.log('Server is running on http://localhost:3000');
    });
};

setup();
