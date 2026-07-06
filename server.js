const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');

const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => res.send('WhatsApp Bot is running smoothly!'));
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed, reconnecting: ', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('Client is fully ready! System is watching for messages.');
        }
    });

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        const userMessage = text.toLowerCase().trim();
        const from = msg.key.remoteJid;

        if (userMessage === 'hi' || userMessage === 'hello') {
            await sock.sendMessage(from, { text: 'Hello! Welcome to our automated service. Type **1** for billing or **2** for downloading our latest brochure.' });
        }
    });
}

console.log('Initializing Lightweight WhatsApp Engine...');
startBot();