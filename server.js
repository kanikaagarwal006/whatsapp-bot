const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('WhatsApp Bot is running!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Initialize the client with local authentication strategy
// Initialize the client with strict memory saving configurations
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './.wwebjs_auth'
    }),
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1018591874-alpha.html'
    },
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
            // Additional RAM/Memory saving flags:
            '--disable-extensions',
            '--js-flags="--max-old-space-size=256"', // Hard limits node/v8 memory usage
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-breakpad',
            '--disable-component-extensions-with-background-pages'
        ]
    }
});

// Add this new event listener right below your QR event listener to watch for hidden blocks
client.on('auth_failure', (msg) => {
    console.error('--- AUTHENTICATION FAILURE ---', msg);
});

// Event: Generate QR Code for linking device
client.on('qr', (qr) => {
    console.log('--- SCAN THE QR CODE BELOW TO LINK ACCOUNT ---');
    qrcode.generate(qr, { small: true });
});

// Event: Successfully authenticated (session found or just scanned)
client.on('authenticated', () => {
    console.log('Authentication successful. Storing session details...');
});

// Event: WhatsApp Web page fully loaded and synced
client.on('ready', () => {
    console.log('Client is fully ready! System is watching for messages.');
});

// Event: Handle incoming messages and execute router logic
client.on('message', async (msg) => {
    const chat = await msg.getChat();
    const userMessage = msg.body.toLowerCase().trim();

    // Route 1: Direct exact text match
    if (userMessage === 'hi' || userMessage === 'hello') {
        await msg.reply('Hello! Welcome to our automated service. Type **1** for billing or **2** for downloading our latest brochure.');
        return;
    }

    // Route 2: Numeric Option Toggles (Best replacement for native interactive UI buttons)
    if (userMessage === '1') {
        await client.sendMessage(msg.from, 'Connecting you to our billing department logs...');
        // Put database search queries here
        return;
    }

    if (userMessage === '2') {
        try {
            await client.sendMessage(msg.from, 'Generating your file, please wait a moment...');
            
            // Sample: Loading a document via URL or local path
            // Format: new MessageMedia(mimetype, base64Data, filename)
            const media = await MessageMedia.fromUrl('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
            
            await client.sendMessage(msg.from, media, { caption: 'Here is the requested brochure.' });
        } catch (error) {
            console.error('Failed to send media:', error);
            await msg.reply('Sorry, I encountered an error pulling that file.');
        }
        return;
    }
});

// Start the client engine
console.log('Initializing WhatsApp Web Engine...');
client.initialize();