import express from 'express';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const app = express();
const port = 3000;
import qrcode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(join(__dirname, 'static')));
app.use("/node_modules", express.static("node_modules"));
app.use("/qr", express.static(join(__dirname, 'qr')));


app.get('/', (req, res) => {
    res.sendFile("static/html/index.html", { root: __dirname });
});

app.get("/generate-qr", (req, res) => {
    const data = req.query.text;

    qrcode.toFile(`qr/${data}.png`, data, {
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