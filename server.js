const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS for Render
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static('.'));

// Simple in-memory storage
let messages = [
  {
    id: 1,
    from: "system",
    text: "Welcome to Matka Messaging!",
    timestamp: new Date().toISOString()
  }
];

// GET all messages
app.get('/messages', (req, res) => {
  res.json(messages);
});

// POST new message
app.post('/messages', (req, res) => {
  const { from, text } = req.body;
  
  if (!from || !text) {
    return res.status(400).json({ error: 'Missing from or text' });
  }
  
  const newMessage = {
    id: messages.length + 1,
    from,
    text,
    timestamp: new Date().toISOString()
  };
  
  messages.push(newMessage);
  
  // Return ALL messages (not just new one)
  res.json(messages);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    messageCount: messages.length
  });
});

// Serve index.html for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Messages in memory: ${messages.length}`);
});
