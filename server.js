const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
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

// Serve static files (for your HTML)
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
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Matka Server</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #1e6cff; }
        .endpoint { background: #f5f7fb; padding: 10px; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <h1>✅ Matka Server is Running!</h1>
      <p>Your chat server is ready to use.</p>
      <div class="endpoint">
        <strong>Endpoints:</strong>
        <ul>
          <li><code>GET /messages</code> - Get all messages</li>
          <li><code>POST /messages</code> - Send a message</li>
          <li><code>GET /health</code> - Health check</li>
        </ul>
      </div>
      <p>Go to <a href="/index.html">/index.html</a> for the chat interface.</p>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
