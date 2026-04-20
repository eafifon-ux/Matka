const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
require("dotenv").config();

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
let emails = [];

const seenUIDs = new Set();

// ===============================
// SMTP
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

    res.json({ ok: true });

  } catch (e) {
    console.error("SEND ERROR FULL:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ===============================
// IMAP CONFIG
// ===============================
const imapConfig = {
  imap: {
    user: EMAIL,
    password: PASSWORD,
    host: "imap.gmail.com",
    port: 993,
    tls: true,
    authTimeout: 10000
  }
};

// ===============================
// IMAP SAFE LOOP
// ===============================
async function checkInbox() {
  let connection;

  try {
    connection = await imaps.connect(imapConfig);
    await connection.openBox("INBOX");

    const messages = await connection.search(["UNSEEN"], {
      bodies: [""],
      markSeen: true
    });

    for (const item of messages) {
      const uid = item.attributes.uid;
      if (seenUIDs.has(uid)) continue;
      seenUIDs.add(uid);

      const raw = item.parts.find(p => p.which === "").body;
      const parsed = await simpleParser(raw);

      emails.unshift({
        id: Date.now(),
        subject: parsed.subject || "No subject",
        from: parsed.from?.text || "unknown",
        date: new Date(parsed.date || Date.now()).toISOString(),
        body: parsed.text || ""
      });

      console.log("📩 IMAP received:", parsed.subject);
    }

  } catch (err) {
    console.error("IMAP ERROR:", err.message);
  }

  if (connection) connection.end();
}

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Mail server running on port ${PORT}`);
});

// ===============================
// START IMAP LOOP (DELAYED START)
// ===============================
setTimeout(() => {
  console.log("📡 Starting IMAP polling...");
  checkInbox();
  setInterval(checkInbox, 20000);
}, 5000);
