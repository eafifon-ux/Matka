const express = require("express");
const cors = require("cors");
const Imap = require("imap-simple");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

/* ===============================
   ENV CONFIG
=============================== */

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

/* ===============================
   SMTP TRANSPORT (SEND EMAIL)
=============================== */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

/* ===============================
   READ EMAILS (IMAP)
=============================== */

const imapConfig = {
  imap: {
    user: EMAIL_USER,
    password: EMAIL_PASS,
    host: "imap.gmail.com",
    port: 993,
    tls: true,
    authTimeout: 10000
  }
};

app.get("/emails", async (req, res) => {
  try {
    const connection = await Imap.connect(imapConfig);

    await connection.openBox("INBOX");

    const messages = await connection.search(["ALL"], {
      bodies: ["HEADER.FIELDS (FROM SUBJECT DATE)", "TEXT"],
      struct: true
    });

    const emails = messages.slice(-30).map(msg => {
      const header = msg.parts.find(p =>
        p.which.includes("HEADER.FIELDS")
      )?.body || {};

      return {
        subject: header.subject?.[0] || "No subject",
        from: header.from?.[0] || "unknown",
        date: header.date?.[0] || new Date().toISOString(),
        body: ""
      };
    });

    connection.end();

    res.json(emails.reverse());
  } catch (err) {
    console.error("IMAP ERROR:", err.message);
    res.json([]);
  }
});

/* ===============================
   SEND EMAIL (SMTP)
=============================== */

app.post("/send", async (req, res) => {
  const { to, subject, body } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    await transporter.sendMail({
      from: EMAIL_USER,
      to,
      subject,
      text: body
    });

    res.json({ success: true });
  } catch (err) {
    console.error("SMTP ERROR:", err.message);
    res.status(500).json({ error: "Send failed" });
  }
});

/* ===============================
   HEALTH
=============================== */

app.get("/", (req, res) => {
  res.send("Matka Mail (Read + Send) running");
});

/* ===============================
   START
=============================== */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on", PORT);
});
