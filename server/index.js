const { openDatabase } = require('./db');
const { createApp } = require('./app');

const PORT = 3001;
// Loopback only by default: the API has no authentication.
const HOST = process.env.CCMOT_HOST || '127.0.0.1';
const ALLOWED_ORIGINS = (process.env.CCMOT_ALLOWED_ORIGINS
    || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173')
    .split(',').map(origin => origin.trim()).filter(Boolean);

const db = openDatabase();
console.log('Database path:', db.name);

createApp(db, { allowedOrigins: ALLOWED_ORIGINS }).listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
});
