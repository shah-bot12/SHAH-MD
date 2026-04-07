const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    delay, 
    makeCacheableSignalKeyStore, 
    DisconnectReason 
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs-extra");

async function startPairing(number, res) {
    // Session folder create karna
    const { state, saveCreds } = await useMultiFileAuthState(`./session`);
    
    try {
        const sock = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
            },
            printQRInTerminal: false,
            logger: pino({ level: "fatal" }),
            browser: ["Chrome (Linux)", "", ""] // Is se pairing code asani se milta hai
        });

        // Pairing code mangwana
        if (!sock.authState.creds.registered) {
            await delay(1500);
            const code = await sock.requestPairingCode(number);
            if (!res.headersSent) {
                res.json({ code: code });
            }
        }

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === "open") {
                await delay(5000);
                
                // creds.json ko read karke Session ID banana
                const credsData = await fs.readJSON("./session/creds.json");
                const session_id = Buffer.from(JSON.stringify(credsData)).toString('base64');
                
                const msg = `*SHAH-MD SESSION CONNECTED*\n\n*ID:* SHAH-MD:${session_id}\n\n_Ye ID kisi ko mat dikhana warna aapka WhatsApp hack ho sakta hai._`;

                // Apne hi number par message bhejna
                await sock.sendMessage(sock.user.id, { text: msg });
                
                console.log("Session ID sent to your WhatsApp!");
                
                // Safayi: Session delete karna taake next time fresh pairing ho sake
                await delay(2000);
                await fs.remove("./session");
                process.exit(0);
            }

            if (connection === "close") {
                const reason = lastDisconnect?.error?.output?.statusCode;
                if (reason !== DisconnectReason.loggedOut) {
                    // Agar logout nahi hua to dubara koshish karein
                    startPairing(number, res);
                }
            }
        });
    } catch (err) {
        console.log("Error in pairing:", err);
        if (!res.headersSent) {
            res.json({ error: "Service temporary down, try again later." });
        }
    }
}

module.exports = { startPairing };
