require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*', // Allow all for MVP, restrict in production
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/triage', require('./routes/triageRoutes'));
app.use('/api/emergency', require('./routes/emergencyRoutes'));
app.use('/api/hospitals', require('./routes/hospitalRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/health-record', require('./routes/healthRecordRoutes')); // Public health record page for QR code

app.get('/', (req, res) => {
    res.send('CareGrid AI API is Running');
});

// Socket.io Connection
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Emergency Room Join
    socket.on('join_emergency', (caseId) => {
        socket.join(caseId);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Make io accessible in routes
app.set('io', io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
