const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ===============================
// MIDDLEWARE - FIXED CORS!
// ===============================
app.use(cors({
  origin: '*', // Allow all origins (or specify: 'https://eafifon-ux.github.io')
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Store messages in memory
let messages = [
  {
    id: 1,
    from: "system",
    text: "Welcome to Matka Messaging!",
    timestamp: new Date().toISOString()
  }
];

// Get all messages
app.get('/messages', (req, res) => {
  console.log('GET /messages - returning', messages.length, 'messages');
  res.json(messages);
});

// Send a message
app.post('/messages', (req, res) => {
  console.log('POST /messages - body:', req.body);
  
  const { from, text } = req.body;
  
  if (!from || !text) {
    return res.status(400).json({ error: 'from and text are required' });
  }
  
  const newMessage = {
    id: messages.length + 1,
    from,
    text,
    timestamp: new Date().toISOString()
  };
  
  messages.push(newMessage);
  console.log('Added message. Total:', messages.length);
  
  res.json({
    success: true,
    message: newMessage
  });
});

// Serve static files (optional)
app.use(express.static('public'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    messageCount: messages.length
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    service: 'Matka Messaging Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      messages: '/messages',
      health: '/health'
    }
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
