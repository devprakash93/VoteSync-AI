require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// ── Allowed Origins ────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'https://votesync-ai.onrender.com', // Production URL — always allowed
  'http://localhost:5173',
  'http://localhost:3000',
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const { apiLimiter } = require('./middleware/rateLimiter');

// ── Core Middleware ────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // CSP blocks Vite's React scripts — disable until nonces are configured
})); // Security headers: XSS, clickjacking, MIME sniffing, etc.
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. Postman, mobile apps, curl)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS policy: Origin "${origin}" not allowed.`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10kb' })); // Body size limit — prevents DoS
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev')); // Request logging

// ── Rate Limiting ──────────────────────────────────────────────────────────
app.use(apiLimiter);

// ── Database ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/online-voting-system';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1); // Exit process if DB connection fails
  });

// ── Socket.io ─────────────────────────────────────────────────────────────
// Make io accessible inside route handlers via req.app.get('io')
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// ── Health Check ──────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Online Voting API is running.' });
});

// ── API Routes ────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/authRoutes'));
app.use('/api/elections',require('./routes/electionRoutes'));
app.use('/api/votes',    require('./routes/voteRoutes'));
app.use('/api/ai',       require('./routes/aiRoutes'));
app.use('/api/audit',    require('./routes/auditRoutes'));
app.use('/api/geo',      require('./routes/geoRoutes'));
app.use('/api/profile',  require('./routes/profileRoutes'));
app.use('/api/admin',    require('./routes/adminRoutes'));

// ── Production Frontend Serving ───────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  const fs = require('fs');

  // Resolve the dist directory relative to the project root (one level above /backend)
  const distPath = path.resolve(__dirname, '..', 'frontend', 'dist');
  const indexPath = path.join(distPath, 'index.html');

  // Log on startup so we can verify the path in Render's logs
  console.log(`📂 Static dist path: ${distPath}`);
  console.log(`📄 index.html exists: ${fs.existsSync(indexPath)}`);

  // Serve all compiled assets (JS, CSS, images, fonts, etc.)
  app.use(express.static(distPath));

  // SPA fallback — serve index.html for any non-API route
  app.get('/*path', (req, res) => {
    // Skip /assets/ — if a file is missing there, return 404 not HTML
    if (req.path.startsWith('/assets/')) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    res.sendFile(indexPath);
  });
} else {
  // ── 404 Handler (Dev only, as prod handles * above) ──────────────────────
  app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found.` });
  });
}

// ── Global Error Handler ──────────────────────────────────────────────────
// Must have 4 parameters so Express recognises it as an error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(`[Error] ${err.message}`);
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// ── Start Server ──────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});
