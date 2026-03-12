const config = require('./config');
const fs = require('fs');
const path = require('path');

module.exports = async (conn, m) => {
    try {
        if (!m.message || m.key.fromMe) return;

        const from = m.key.remoteJid;
        const body = (m.mtype === 'conversation') ? m.message.conversation : (m.mtype === 'extendedTextMessage') ? m.message.extendedTextMessage.text : (m.mtype == 'imageMessage') && m.message.imageMessage.caption ? m.message.imageMessage.caption : (m.mtype == 'videoMessage') && m.message.videoMessage.caption ? m.message.videoMessage.caption : '';
        
        const isCmd = body.startsWith(config.prefix);
        const commandName = isCmd ? body.slice(config.prefix.length).trim().split(/ +/).shift().toLowerCase() : "";

        if (isCmd) {
            const pluginsDir = path.join(__dirname, 'plugins');
            const files = fs.readdirSync(pluginsDir);

            for (const file of files) {
                if (file.endsWith('.js')) {
                    const plugin = require(path.join(pluginsDir, file));
                    if (plugin.name === commandName) {
                        // Command chalane se pehle bot "Typing..." show kare (Heavy look)
                        await conn.sendPresenceUpdate('composing', from);
                        
                        await plugin.execute(conn, m);
                        return;
                    }
                }
            }
        }
    } catch (err) {
        console.error("☠️ Handler Error:", err);
        // Error aane par owner ko inform karna (optional)
        // await conn.sendMessage(config.ownerNumber + "@s.whatsapp.net", { text: `Error in Command: ${err.message}` });
    }
};
