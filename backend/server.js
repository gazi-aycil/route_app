const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');

const app = express();

// Önce CORS middleware - EN KRİTİK KISIM
app.use(cors({
  origin: [
    'https://octo-route.netlify.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'https://your-app.netlify.app' // Netlify domain'iniz
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// OPTIONS istekleri için global handler - EN ÖNEMLİ KISIM
app.options('*', cors());

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    cors: 'enabled'
  });
});

// Test endpoint - CORS test için
app.get('/api/test-cors', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).json({ 
    message: 'CORS is working!',
    origin: req.headers.origin,
    method: req.method
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// MongoDB connection (optional)
if (MONGODB_URI && MONGODB_URI.startsWith('mongodb')) {
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log('MongoDB connected successfully');
    })
    .catch(err => {
      console.error('MongoDB connection error:', err);
    });
} else {
  console.log('MongoDB URI not provided, using in-memory storage');
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📍 CORS test: http://localhost:${PORT}/api/test-cors`);
  console.log(`📍 Allowed origins: https://octo-route.netlify.app, http://localhost:3000, http://localhost:5173`);
});

module.exports = app;