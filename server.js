const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ===============================
// MIDDLEWARE
// ===============================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 DEBUG: show every request hitting server
app.use((req, res, next) => {
  console.log("➡️", req.method, req.path);
  if (req.method === "POST") {
    console.log("BODY:", req.body);
  }
  next();
});

// ===============================
// CONFIG
// ===============================
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;

console.log("📧 EMAIL LOADED:", EMAIL);

if (!EMAIL || !PASSWORD) {
  console.error("❌ Missing EMAIL or PASSWORD in environment variables");
}

// ===============================
// INBOX
// ===============================
let emails = [];

// ===============================
// SMTP (SEND EMAIL)
// ===============================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL,
    pass: PASSWORD
  }
});

// ===============================
// HEALTH CHECK
// ===============================
app.get("/", (req, res) => {
  res.send("Matka Mail Server Running");
});

// ===============================
// GET EMAILS
// ===============================
app.get("/emails", (req, res) => {
  res.json(emails);
});

// ===============================
// TEST ROUTE (IMPORTANT DEBUG TOOL)
// ===============================
app.get("/test-incoming", (req, res) => {
  emails.unshift({
    id: Date.now(),
    subject: "TEST EMAIL WORKS",
    from: "system",
    body: "manual test",
    date: new Date().toISOString()
  });

  res.send("OK");
});

// ===============================
// SEND EMAIL
// ===============================
app.post("/send", async (req, res) => {
  const { to, subject, body } = req.body;

  try {
    await transporter.sendMail({
      from: EMAIL,
      to,
      subject,
      text: body
    });

    console.log("📤 SENT:", subject);

    res.json({ ok: true });

  } catch (e) {
    console.error("SEND ERROR:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ===============================
// INCOMING EMAIL (FROM CLOUDFLARE WORKER)
// ===============================
app.post("/incoming-email", (req, res) => {
  const email = {
    id: Date.now(),
    subject: req.body.subject || "(no subject)",
    from: req.body.from || req.body.sender || "unknown",
    body: req.body.body || req.body.text || "",
    date: new Date().toISOString()
  };

  emails.unshift(email);

  console.log("📩 RECEIVED EMAIL:", email);

  res.status(200).json({ ok: true });
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Mail server running on port ${PORT}`);
});
