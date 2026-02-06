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
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection with retry logic and options
const connectDB = async () => {
    const options = {
        serverSelectionTimeoutMS: 30000, // 30 seconds
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        retryWrites: true,
        w: 'majority'
    };

    try {
        await mongoose.connect(process.env.MONGO_URI, options);
        console.log('✅ MongoDB Connected Successfully');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
        console.log('⏳ Retrying connection in 5 seconds...');
        setTimeout(connectDB, 5000);
    }
};

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('📊 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('📛 Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ Mongoose disconnected. Attempting to reconnect...');
    setTimeout(connectDB, 5000);
});

// Connect to database
connectDB();

// Routes
console.log('Registering routes...');
app.use('/api/auth', require('./routes/authRoutes'));
console.log(' - /api/auth registered');
app.use('/api/triage', require('./routes/triageRoutes'));
app.use('/api/emergency', require('./routes/emergencyRoutes'));
app.use('/api/hospitals', require('./routes/hospitalRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/health-record', require('./routes/healthRecordRoutes')); // Public health record page for QR code

app.get('/', (req, res) => {
    res.send('CareGrid AI API is Running');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({
        status: 'ok',
        database: dbStatus,
        timestamp: new Date().toISOString()
    });
});

// Socket.io Connection
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

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
