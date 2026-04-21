const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/* ===============================
   MATKA MESSAGE STORE (IN MEMORY)
   (later we upgrade to DB)
=============================== */

let messages = [
  {
    id: 1,
    from: "system",
    to: "all",
    text: "Matka Messaging is live.",
    timestamp: new Date().toISOString()
  }
];

/* ===============================
   GET MESSAGES
=============================== */

app.get("/messages", (req, res) => {
  const { user } = req.query;

  // optional filtering later
  if (user) {
    return res.json(
      messages.filter(
        m => m.to === user || m.to === "all" || m.from === user
      )
    );
  }

  res.json(messages);
});

/* ===============================
   SEND MESSAGE
=============================== */

app.post("/messages", (req, res) => {
  const { from, to, text } = req.body;

  if (!from || !text) {
    return res.status(400).json({
      error: "from and text are required"
    });
  }

  const newMessage = {
    id: messages.length + 1,
    from,
    to: to || "all",
    text,
    timestamp: new Date().toISOString()
  };

  messages.push(newMessage);

  res.json({
    success: true,
    message: newMessage
  });
});

/* ===============================
   DELETE (optional debug tool)
=============================== */

app.delete("/messages", (req, res) => {
  messages = [];
  res.json({ success: true, cleared: true });
});

/* ===============================
   HEALTH CHECK
=============================== */

app.get("/", (req, res) => {
  res.send("Matka Messaging Server running");
});

/* ===============================
   START SERVER
=============================== */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Matka Messaging running on port", PORT);
});
