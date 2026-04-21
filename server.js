app.get("/emails", async (req, res) => {
  console.log("\n==============================");
  console.log("📡 EMAIL REQUEST STARTED");
  console.log("==============================");

  try {
    console.log("📶 Connecting to IMAP...");
    console.log("User:", EMAIL_USER ? "SET" : "MISSING");
    console.log("Pass:", EMAIL_PASS ? "SET" : "MISSING");

    const connection = await Imap.connect(imapConfig);

    console.log("✅ IMAP connected");

    await connection.openBox("INBOX");
    console.log("📥 INBOX opened");

    const messages = await connection.search(["ALL"], {
      bodies: ["HEADER.FIELDS (FROM SUBJECT DATE)"],
      struct: true
    });

    console.log("📨 Messages found:", messages.length);

    const emails = messages.slice(-20).map((msg, i) => {
      const headerPart = msg.parts.find(p =>
        p.which.includes("HEADER.FIELDS")
      );

      const header = headerPart?.body || {};

      console.log(`➡️ Parsing email ${i + 1}`);

      return {
        subject: header.subject?.[0] || "No subject",
        from: header.from?.[0] || "unknown",
        date: header.date?.[0] || new Date().toISOString()
      };
    });

    connection.end();

    console.log("✅ IMAP connection closed");
    console.log("📦 Sending emails:", emails.length);

    return res.json(emails.reverse());

  } catch (err) {
    console.error("\n🔥🔥 IMAP FULL ERROR 🔥🔥");
    console.error("Message:", err.message);
    console.error("Code:", err.code);
    console.error("Full error:", err);

    return res.status(500).json({
      error: err.message,
      code: err.code || "UNKNOWN",
      hint: "Check Gmail App Password + IMAP access"
    });
  }
});
