/**
 * index.js – Express entry point
 * Serves the REST API on PORT (default 5000).
 * In production on EC2, Nginx proxies port 80 → port 5000.
 */
require('dotenv').config({ path: '.env' }); // optional .env for local dev

const express = require('express');
const cors = require('cors');
const path = require('path');

const taskRoutes = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 5000;

/* ── Middleware ── */
// Explicit CORS – allows POST/PUT/DELETE and handles OPTIONS preflight
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors()); // respond 200 to ALL preflight OPTIONS requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── API Routes ── */
// EC2 Nginx strips the /api/ prefix before forwarding to Express.
// So Express only ever sees: /create  /read  /update  /delete/:id
// Nginx config: proxy_pass http://127.0.0.1:5000/;  (trailing slash = strip)
app.use('/', taskRoutes);

/* ── Health check ── */
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

/* ── Serve React build in production ── */
// After running `npm run build` inside /client, the dist/ folder is served here.
const CLIENT_BUILD = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(CLIENT_BUILD));
app.get('*', (_req, res) => res.sendFile(path.join(CLIENT_BUILD, 'index.html')));

/* ── Start ── */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`DynamoDB table: ${process.env.DYNAMODB_TABLE || 'Tasks'}`);
  console.log(`AWS Region   : ${process.env.AWS_REGION || 'us-east-1'}`);
});

module.exports = app;
