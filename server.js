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
// INBOX (REAL DATA ONLY)
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
// HEALTH
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
// 🔥 INCOMING EMAIL (FROM CLOUDFLARE WORKER)
// ===============================
app.post("/incoming-email", (req, res) => {
  const sender = req.body.sender || req.body.from;
  const subject = req.body.subject || "(no subject)";
  const body =
    req.body["body-plain"] ||
    req.body.text ||
    "";

  const email = {
    id: Date.now(),
    subject,
    from: sender,
    date: new Date().toISOString(),
    body
  };

  emails.unshift(email);

  console.log("📩 RECEIVED:", subject);

  res.status(200).send("OK");
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Mail server running on port ${PORT}`);
});
