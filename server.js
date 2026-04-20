const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// ===============================
// CONFIG
// ===============================
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error("❌ Missing EMAIL or PASSWORD in environment variables");
}

// ===============================
// IN-MEMORY INBOX (WORKING)
// ===============================
let emails = [
  {
    id: 1,
    subject: "Welcome to Matka",
    from: "system@matka",
    date: new Date().toISOString()
  },
  {
    id: 2,
    subject: "Your GPC system is live",
    from: "engine@matka",
    date: new Date().toISOString()
  }
];

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
  res.send("Mail server running OK");
});

// ===============================
// GET EMAILS (NO IMAP)
// ===============================
app.get("/emails", (req, res) => {
  console.log("📥 Returning emails:", emails.length);
  res.json(emails);
});

// ===============================
// SEND EMAIL + SAVE TO INBOX
// ===============================
app.post("/send", async (req, res) => {
  const { to, subject, body } = req.body;

  if (!EMAIL || !PASSWORD) {
    return res.status(500).json({ ok: false, error: "Missing credentials" });
  }

  try {
    // 🔥 ADD TO INBOX FIRST
    emails.unshift({
      id: Date.now(),
      subject,
      from: EMAIL,
      date: new Date().toISOString()
    });

    // 🔥 SEND REAL EMAIL (optional but nice)
    await transporter.sendMail({
      from: EMAIL,
      to,
      subject,
      text: body
    });

    res.json({ ok: true });

  } catch (e) {
    console.error("SEND ERROR:", e);
    res.json({ ok: false });
  }
});

// ===============================
// RENDER PORT FIX
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Mail server running on port ${PORT}`);
});
