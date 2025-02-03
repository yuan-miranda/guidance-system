import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import qrcode from 'qrcode';

const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(join(__dirname, 'static')));
app.use("/qr", express.static(join(__dirname, 'qr')));

app.get('/', (req, res) => {
    res.sendFile("static/html/index.html", { root: __dirname });
});

app.get("/generate-qr", (req, res) => {
    const data = req.query.text;
    const url = `https://example.com/${data}`;

    qrcode.toFile(`qr/${data}.png`, url, {
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

app.listen(port, () => {
    console.log(`app listening at http://localhost:${port}`);
});