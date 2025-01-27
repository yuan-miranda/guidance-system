import express from 'express';
import { engine } from 'express-handlebars';

const app = express();

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');

app.get('/', (req, res) => {
    res.render('home', { title: 'Home' });
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});