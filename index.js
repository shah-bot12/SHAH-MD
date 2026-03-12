const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const P = require("pino");
const chalk = require("chalk");
const config = require("./config");
const handler = require("./handler");

async function startShah() {
    const { state, saveCreds } = await useMultiFileAuthState("session");
    const { version } = await fetchLatestBaileysVersion();

    const conn = makeWASocket({
        version,
        logger: P({ level: "silent" }),
        printQRInTerminal: false,
        auth: state,
        browser: ["SHAH-MD", "Safari", "3.0.0"]
    });

    // Pairing Code Request
    if (!conn.authState.creds.registered) {
        setTimeout(async () => {
            let code = await conn.requestPairingCode(config.ownerNumber);
            console.log(chalk.white.bgRed.bold("\n ☠️ YOUR PAIRING CODE: " + code + " \n"));
        }, 3000);
    }

    conn.ev.on("creds.update", saveCreds);

    conn.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "open") {
            console.log(chalk.green.bold("\n✅ SHAH-MD Connected! Ab shreekan de kalje phatne wale hain. ☠️"));
        }
        if (connection === "close") {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startShah();
        }
    });

    // Message Handler Call
    conn.ev.on("messages.upsert", async (chatUpdate) => {
        const m = chatUpdate.messages[0];
        await handler(conn, m);
    });

    // Automatic Welcome/Goodbye
    conn.ev.on("group-participants.update", async (anu) => {
        try {
            let metadata = await conn.groupMetadata(anu.id);
            let participants = anu.participants;
            for (let num of participants) {
                let ppuser;
                try { ppuser = await conn.profilePictureUrl(num, 'image'); } 
                catch { ppuser = 'https://telegra.ph/file/241fb404c000109c31406.jpg'; }

                if (anu.action == 'add') {
                    await conn.sendMessage(anu.id, { 
                        image: { url: ppuser }, 
                        caption: `Welcome @${num.split("@")[0]} to ${metadata.subject}!\n\nRule follow krin warna shreekan wala hall ho ga. ☠️`,
                        mentions: [num]
                    });
                } else if (anu.action == 'remove') {
                    await conn.sendMessage(anu.id, { 
                        image: { url: ppuser }, 
                        caption: `Goodbye @${num.split("@")[0]}!\n\nDafa ho jao! 👋☠️`,
                        mentions: [num]
                    });
                }
            }
        } catch (err) { console.log(err); }
    });
}

startShah();
