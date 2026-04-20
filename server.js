const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
require("dotenv").config();

// 🔥 NEW
const imaps = require("imap-simple");
const { simpleParser } = require("mailparser");

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

// 🔥 DEDUPE
const seenUIDs = new Set();

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
// IMAP CONFIG (RECEIVE EMAIL)
// ===============================
const imapConfig = {
  imap: {
    user: EMAIL,
    password: PASSWORD, // ⚠️ must be App Password
    host: "imap.gmail.com",
    port: 993,
    tls: true,
    authTimeout: 5000,
  }
};

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
  res.json(emails);
});

// ===============================
// SEND EMAIL + SAVE
// ===============================
app.post("/send", async (req, res) => {
  const { to, subject, body } = req.body;

  if (!EMAIL || !PASSWORD) {
    return res.status(500).json({ ok: false });
  }

  try {
    emails.unshift({
      id: Date.now(),
      subject,
      from: EMAIL,
      date: new Date().toISOString(),
      body
    });

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
// IMAP FETCH FUNCTION
// ===============================
async function checkInbox() {
  try {
    const connection = await imaps.connect(imapConfig);
    await connection.openBox("INBOX");

    const messages = await connection.search(["UNSEEN"], {
      bodies: [""],
      struct: true,
      markSeen: true
    });

    for (let item of messages) {
      const uid = item.attributes.uid;

      if (seenUIDs.has(uid)) continue;
      seenUIDs.add(uid);

      const raw = item.parts.find(p => p.which === "").body;
      const parsed = await simpleParser(raw);

      const email = {
        id: Date.now(),
        subject: parsed.subject || "No subject",
        from: parsed.from?.text || "unknown",
        date: parsed.date
          ? new Date(parsed.date).toISOString()
          : new Date().toISOString(),
        body: parsed.text || ""
      };

      emails.unshift(email);

      console.log("📩 IMAP received:", email.subject);
    }

    connection.end();

  } catch (err) {
    console.error("IMAP ERROR:", err.message);
  }
}

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Mail server running on port ${PORT}`);
});

// 🔥 START IMAP POLLING
setInterval(checkInbox, 15000);
