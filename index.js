const express = require('express');
const path = require('path');
const { startPairing } = require('./pair');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>SHAH-MD Pairing</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { background-color: #000; color: #fff; font-family: Arial; text-align: center; padding-top: 50px; }
                input { padding: 12px; width: 80%; max-width: 300px; border-radius: 5px; border: none; margin-bottom: 20px; }
                button { padding: 12px 25px; background-color: #1ed760; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; }
                #code { margin-top: 30px; font-size: 24px; letter-spacing: 5px; color: #1ed760; }
            </style>
        </head>
        <body>
            <h2>Shah Saab MD Pairing</h2>
            <p>Enter number with country code (e.g. 923xxxxxxxx)</p>
            <input type="number" id="num" placeholder="923223246090"><br>
            <button onclick="getCode()">Get Pairing Code</button>
            <div id="code"></div>
            <script>
                async function getCode() {
                    const n = document.getElementById('num').value;
                    const codeDiv = document.getElementById('code');
                    if(!n) return alert('Number likho yaar!');
                    codeDiv.innerText = "Mangwa raha hoon...";
                    try {
                        const res = await fetch('/pair?number=' + n);
                        const data = await res.json();
                        codeDiv.innerText = data.code || "Error: Dubara try karo";
                    } catch (e) {
                        codeDiv.innerText = "Server Error!";
                    }
                }
            </script>
        </body>
        </html>
    `);
});

app.get('/pair', async (req, res) => {
    const num = req.query.number;
    if (!num) return res.json({ error: "Number missing" });
    await startPairing(num, res);
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
