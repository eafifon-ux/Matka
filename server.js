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
app.use(express.urlencoded({ extended: true })); // 🔥 REQUIRED FOR MAILGUN

// ===============================
// CONFIG
// ===============================
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error("❌ Missing EMAIL or PASSWORD in environment variables");
}

// ===============================
// IN-MEMORY INBOX
// ===============================
let emails = [
  {
    id: 1,
    subject: "Welcome to Matka",
    from: "system@matka",
    date: new Date().toISOString(),
    body: "Welcome email"
  },
  {
    id: 2,
    subject: "Your GPC system is live",
    from: "engine@matka",
    date: new Date().toISOString(),
    body: "System initialized"
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
// GET EMAILS
// ===============================
app.get("/emails", (req, res) => {
  console.log("📥 Returning emails:", emails.length);
  res.json(emails);
});

// ===============================
// SEND EMAIL + SAVE
// ===============================
app.post("/send", async (req, res) => {
  const { to, subject, body } = req.body;

  if (!EMAIL || !PASSWORD) {
    return res.status(500).json({ ok: false, error: "Missing credentials" });
  }

  try {
    // Save to inbox
    emails.unshift({
      id: Date.now(),
      subject,
      from: EMAIL,
      date: new Date().toISOString(),
      body
    });

    // Send real email
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
// 🔥 RECEIVE EMAIL (MAILGUN)
// ===============================
app.post("/incoming-email", (req, res) => {
  const sender = req.body.sender;
  const recipient = req.body.recipient;
  const subject = req.body.subject;
  const text = req.body["body-plain"];

  console.log("📩 Incoming email:", { sender, subject });

  // Save to inbox
  emails.unshift({
    id: Date.now(),
    subject: subject || "(no subject)",
    from: sender,
    date: new Date().toISOString(),
    body: text || ""
  });

  res.status(200).send("OK");
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Mail server running on port ${PORT}`);
});
