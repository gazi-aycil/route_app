const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Geçici user storage (MongoDB bağlantısı yoksa kullanılacak)
let temporaryUsers = [];

// Tüm route'lar için CORS headers - ÖNEMLİ
router.use((req, res, next) => {
  const allowedOrigins = [
    'https://octo-route.netlify.app',
    'http://localhost:3000', 
    'http://localhost:5173'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  next();
});

// OPTIONS istekleri için özel handler - KRİTİK
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.status(200).send();
});

// Helper function to find user
const findUser = async (email) => {
  try {
    // MongoDB bağlıysa kullan
    if (mongoose && mongoose.connection && mongoose.connection.readyState === 1) {
      const User = require('../models/User');
      const user = await User.findOne({ email });
      if (user) return user;
    }
  } catch (error) {
    console.log('MongoDB not available, using temporary storage');
  }
  
  // Temporary storage'da ara
  return temporaryUsers.find(u => u.email === email);
};

// Helper function to create user
const createUser = async (userData) => {
  try {
    // MongoDB bağlıysa kullan
    if (mongoose && mongoose.connection && mongoose.connection.readyState === 1) {
      const User = require('../models/User');
      const user = new User(userData);
      await user.save();
      return user;
    }
  } catch (error) {
    console.log('MongoDB not available, using temporary storage');
  }
  
  // Temporary storage'a kaydet
  const user = {
    _id: Date.now().toString(),
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  temporaryUsers.push(user);
  return user;
};

// Login endpoint
router.get('/login', async (req, res) => {
  console.log('Login request received:', { 
    email: req.body.email,
    origin: req.headers.origin,
    method: req.method 
  });

  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required',
        success: false
      });
    }

    // Check if user exists
    const user = await findUser(email);
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid email or password',
        success: false
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Invalid email or password',
        success: false
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        name: user.name 
      },
      process.env.JWT_SECRET || 'fallback_secret_key_2024_octo_route_render',
      { expiresIn: '24h' }
    );

    console.log('Login successful for user:', email);

    // Send success response
    res.status(200).json({
      message: 'Login successful',
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Server error during login',
      success: false,
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

// Register endpoint
router.post('/register', async (req, res) => {
  console.log('Register request received:', {
    name: req.body.name,
    email: req.body.email,
    origin: req.headers.origin
  });

  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'Name, email and password are required',
        success: false
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long',
        success: false
      });
    }

    // Check if user already exists
    const existingUser = await findUser(email);
    if (existingUser) {
      return res.status(409).json({ 
        message: 'User already exists with this email',
        success: false
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = await createUser({
      name,
      email,
      password: hashedPassword
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser._id,
        email: newUser.email,
        name: newUser.name 
      },
      process.env.JWT_SECRET || 'fallback_secret_key_2024_octo_route_render',
      { expiresIn: '24h' }
    );

    console.log('Registration successful for user:', email);

    // Send success response
    res.status(201).json({
      message: 'User created successfully',
      success: true,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Server error during registration',
      success: false,
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

// Verify token endpoint
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ 
        valid: false,
        message: 'Token is required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_2024_octo_route_render');
    
    // Find user to make sure they still exist
    const user = await findUser(decoded.email);
    if (!user) {
      return res.status(401).json({ 
        valid: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      valid: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ 
      valid: false,
      message: 'Invalid token'
    });
  }
});

// Get all users (for testing)
router.get('/users', (req, res) => {
  res.status(200).json({
    users: temporaryUsers.map(u => ({ id: u._id, name: u.name, email: u.email })),
    count: temporaryUsers.length
  });
});

module.exports = router;