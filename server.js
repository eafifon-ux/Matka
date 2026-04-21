const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/* ===============================
   TEMP IN-MEMORY EMAIL STORE
=============================== */

let emails = [
  {
    id: 1,
    subject: "Welcome to Matka Mail",
    from: "system@matka.local",
    date: new Date().toISOString(),
    body: "Your email system is now working."
  },
  {
    id: 2,
    subject: "Test Email",
    from: "demo@matka.local",
    date: new Date(Date.now() - 3600 * 1000).toISOString(),
    body: "This is a second test message."
  }
];

/* ===============================
   ROUTES
=============================== */

// GET emails
app.get("/emails", (req, res) => {
  res.json(emails);
});

// ADD test email (for debugging)
app.post("/emails", (req, res) => {
  const { subject, from, body } = req.body;

  const newEmail = {
    id: emails.length + 1,
    subject: subject || "No subject",
    from: from || "unknown",
    body: body || "",
    date: new Date().toISOString()
  };

  emails.unshift(newEmail);

  res.json({ success: true, email: newEmail });
});

// health check
app.get("/", (req, res) => {
  res.send("Matka Mail server running");
});

/* ===============================
   START SERVER
=============================== */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
