const express = require('express');
const path = require('path');
const net = require('net');
const app = express();
const PORT = 3000;
const SOCKET_PATH = '/run/tuxpulse.sock';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Proxy API calls to the secure Unix socket
app.all('/api/:command', (req, res) => {
    const command = req.params.command;
    const client = net.createConnection(SOCKET_PATH);

    client.on('connect', () => {
        client.write(JSON.stringify({ command, args: req.body.args || [] }));
    });

    client.on('data', (data) => {
        try {
            res.json(JSON.parse(data.toString()));
        } catch (e) {
            res.status(500).json({ error: 'Invalid response from helper' });
        }
        client.end();
    });

    client.on('error', (err) => {
        res.status(500).json({ error: 'Could not connect to TuxPulse helper. Is the service running?', details: err.message });
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '127.0.0.1', () => {
    console.log(`TuxPulse UI server running at http://127.0.0.1:${PORT}`);
});
