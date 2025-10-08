const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Geçici user storage (MongoDB bağlantısı yoksa kullanılacak)
let temporaryUsers = [];

// CORS preflight için özel handler
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).send();
});

// Helper function to find user
const findUser = async (email) => {
  try {
    // Önce MongoDB'de ara
    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email });
      if (user) return user;
    }
    
    // MongoDB'de yoksa temporary storage'da ara
    return temporaryUsers.find(u => u.email === email);
  } catch (error) {
    // MongoDB hatasında temporary storage'a dön
    return temporaryUsers.find(u => u.email === email);
  }
};

// Helper function to create user
const createUser = async (userData) => {
  try {
    // Önce MongoDB'ye kaydet
    if (mongoose.connection.readyState === 1) {
      const user = new User(userData);
      await user.save();
      return user;
    }
    
    // MongoDB yoksa temporary storage'a kaydet
    const user = {
      _id: Date.now().toString(),
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    temporaryUsers.push(user);
    return user;
  } catch (error) {
    // MongoDB hatasında temporary storage'a kaydet
    const user = {
      _id: Date.now().toString(),
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    temporaryUsers.push(user);
    return user;
  }
};

// Login endpoint
router.post('/login', async (req, res) => {
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
      process.env.JWT_SECRET || 'fallback_secret_key_2024_octo_route',
      { expiresIn: '24h' }
    );

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
      success: false
    });
  }
});

// Register endpoint
router.post('/register', async (req, res) => {
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
      process.env.JWT_SECRET || 'fallback_secret_key_2024_octo_route',
      { expiresIn: '24h' }
    );

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
      success: false
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_2024_octo_route');
    
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

module.exports = router;