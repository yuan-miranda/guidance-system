const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'supersecretkey',
    resave: false,
    saveUninitialized: true
}));

const users = {}; 

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (users[username] && users[username] === password) {
        req.session.username = username;
        res.redirect('/welcome');
    } else {
        res.send('Invalid username or password');
    }
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (username in users) {
        res.send('Username already taken');
    } else {
        users[username] = password;
        req.session.username = username;
        res.redirect('/welcome');
    }
});

app.get('/welcome', (req, res) => {
    if (req.session.username) {
        res.send(`Welcome, ${req.session.username}! <a href="/logout">Logout</a>`);
    } else {
        res.redirect('/');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
