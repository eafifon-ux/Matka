const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/* ===============================
   MATKA MESSAGE STORE (IN MEMORY)
=============================== */

let messages = [
  {
    id: 1,
    from: "system",
    to: "all",
    text: "Welcome to Matka Messaging!",
    timestamp: new Date().toISOString()
  }
];

/* ===============================
   GET ALL MESSAGES
=============================== */

app.get("/messages", (req, res) => {
  console.log("GET /messages - returning", messages.length, "messages");
  res.json(messages);
});

/* ===============================
   SEND MESSAGE
=============================== */

app.post("/messages", (req, res) => {
  const { from, text } = req.body;
  
  console.log("POST /messages - from:", from, "text:", text);

  if (!from || !text) {
    return res.status(400).json({
      error: "from and text are required"
    });
  }

  const newMessage = {
    id: messages.length + 1,
    from,
    to: "all",
    text,
    timestamp: new Date().toISOString()
  };

  messages.push(newMessage);

  console.log("Added message, total:", messages.length);
  
  res.json({
    success: true,
    message: newMessage
  });
});

/* ===============================
   DELETE (for testing)
=============================== */

app.delete("/messages", (req, res) => {
  messages = [];
  res.json({ success: true, cleared: true });
});

/* ===============================
   SERVE STATIC FILES (HTML)
=============================== */

app.use(express.static('.')); // This serves index.html

/* ===============================
   HEALTH CHECK
=============================== */

app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy",
    messages: messages.length,
    users: [...new Set(messages.map(m => m.from))]
  });
});

/* ===============================
   START SERVER
=============================== */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Matka Messaging Server running on port", PORT);
  console.log(`📁 Serving files from: ${__dirname}`);
});
