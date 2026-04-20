require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const { apiLimiter } = require('./middleware/rateLimiter');

app.use(express.json());
app.use(cors());

// Apply global rate limiting to all requests
app.use(apiLimiter);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/online-voting-system';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log('MongoDB connection error:', err));

// Set up socket.io globally so we can use it in routes
app.set('io', io);

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.get('/', (req, res) => {
  res.send('API is running...');
});

// Import Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/elections', require('./routes/electionRoutes'));
app.use('/api/votes', require('./routes/voteRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/audit', require('./routes/auditRoutes'));
app.use('/api/geo', require('./routes/geoRoutes'));

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
