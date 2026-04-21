const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const DATA_FILE = "./emails.json";

// ===============================
// LOAD EXISTING EMAILS
// ===============================
let emails = [];

if (fs.existsSync(DATA_FILE)) {
  try {
    emails = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    emails = [];
  }
}

// ===============================
// SAVE FUNCTION
// ===============================
function saveEmails() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(emails, null, 2));
}

// ===============================
// HEALTH
// ===============================
app.get("/", (req, res) => {
  res.send("Matka Mail Running");
});

// ===============================
// GET EMAILS
// ===============================
app.get("/emails", (req, res) => {
  res.json(emails);
});

// ===============================
// INCOMING EMAIL
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

  // keep last 200 emails only
  emails = emails.slice(0, 200);

  saveEmails();

  console.log("📩 EMAIL RECEIVED:", email.subject);

  res.send("OK");
});

// ===============================
// START
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));
