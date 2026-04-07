// Is code ko pair.js ke naam se save karein
const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
const pino = require("pino");

const app = express();
const port = 3000;

app.get('/pair', async (req, res) => {
    let num = req.query.number;
    if (!num) return res.send({ error: "Number bheinjein!" });

    const { state, saveCreds } = await useMultiFileAuthState(`./session`);
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }),
    });

    if (!sock.authState.creds.registered) {
        await delay(1500);
        num = num.replace(/[^0-9]/g, '');
        const code = await sock.requestPairingCode(num);
        res.send({ code: code });
    }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
