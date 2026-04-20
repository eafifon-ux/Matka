const express = require("express");
const nodemailer = require("nodemailer");
const Imap = require("imap-simple");
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
// FETCH EMAILS (FINAL FIXED)
// ===============================
async function fetchEmails() {
  if (!EMAIL || !PASSWORD) return [];
  
  const config = {
    imap: {
      user: EMAIL,
      password: PASSWORD,
      host: "imap.gmail.com",
      port: 993,
      tls: true,
      authTimeout: 20000
    }
  };
  
  let connection;
  
  try {
    connection = await Imap.connect(config);

    // 🔥 Gmail-safe mailbox
    await connection.openBox("[Gmail]/All Mail");

    // 🔥 Gmail-safe query (recent emails only)
    const messages = await connection.search(
      [['SINCE', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)]],
      {
        bodies: ["HEADER.FIELDS (FROM TO SUBJECT DATE)"],
        markSeen: false
      }
    );

    // 🔥 newest emails first
    const emails = messages
      .slice(-10)
      .reverse()
      .map(item => {
        const headerPart = item.parts.find(p => p.which.includes("HEADER"));
        const header = headerPart ? headerPart.body : {};
        
        return {
          subject: header.subject?.[0] || "No subject",
          from: header.from?.[0] || "unknown",
          date: header.date?.[0] || new Date().toISOString()
        };
      });

    return emails;
    
  } catch (err) {
    console.error("❌ IMAP ERROR:", err.message || err);
    return [];
    
  } finally {
    if (connection) {
      try { connection.end(); } catch (e) {}
    }
  }
}

// ===============================
// HEALTH CHECK
// ===============================
app.get("/", (req, res) => {
  res.send("Mail server running OK");
});

// ===============================
// GET EMAILS
// ===============================
app.get("/emails", async (req, res) => {
  console.log("🔥 /emails request received");
  
  try {
    const emails = await fetchEmails();
    res.json(emails);
  } catch (e) {
    console.error("EMAIL ROUTE ERROR:", e);
    res.status(500).json([]);
  }
});

// ===============================
// SEND EMAIL
// ===============================
app.post("/send", async (req, res) => {
  const { to, subject, body } = req.body;
  
  if (!EMAIL || !PASSWORD) {
    return res.status(500).json({ ok: false, error: "Missing credentials" });
  }
  
  try {
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
