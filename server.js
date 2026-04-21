const express = require("express");
const cors = require("cors");
const Imap = require("imap-simple");

const app = express();
app.use(cors());
app.use(express.json());

/* ===============================
   GMAIL IMAP CONFIG
   (YOU MUST SET ENV VARS)
=============================== */

const imapConfig = {
  imap: {
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASS, // Gmail App Password
    host: "imap.gmail.com",
    port: 993,
    tls: true,
    authTimeout: 10000
  }
};

/* ===============================
   GET REAL EMAILS
=============================== */

app.get("/emails", async (req, res) => {
  try {
    const connection = await Imap.connect(imapConfig);

    await connection.openBox("INBOX");

    const searchCriteria = ["ALL"];
    const fetchOptions = {
      bodies: ["HEADER.FIELDS (FROM TO SUBJECT DATE)", "TEXT"],
      struct: true
    };

    const messages = await connection.search(searchCriteria, fetchOptions);

    const emails = messages.slice(-20).map(msg => {
      const headerPart = msg.parts.find(p =>
        p.which.includes("HEADER.FIELDS")
      );

      const headers = headerPart?.body || {};

      return {
        subject: headers.subject?.[0] || "No subject",
        from: headers.from?.[0] || "unknown",
        date: headers.date?.[0] || new Date().toISOString(),
        body: ""
      };
    });

    connection.end();

    res.json(emails.reverse());
  } catch (err) {
    console.error("IMAP ERROR:", err.message);
    res.json([]); // frontend fallback will show
  }
});

/* ===============================
   KEEP YOUR TEST SYSTEM (optional)
=============================== */

let emails = [];

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

/* ===============================
   HEALTH CHECK
=============================== */

app.get("/", (req, res) => {
  res.send("Matka Mail server running");
});

/* ===============================
   START
=============================== */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
