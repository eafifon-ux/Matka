// ===============================
// GPC ENGINE
// ===============================

const GPC = {
  epochUTC: Date.UTC(1982, 2, 24),
  epochYear: 5979,

  weekEmojis: ['🟠', '🟤', '🌺', '🌏', '🟢', '🔵', '🟣'],

  suitCodes: [0x2663, 0x2666, 0x2665, 0x2660],
  heptads: Object.create(null),

  initHeptads() {
    const starts = [
      1, 8, 15, 22, 31, 38, 45, 52, 61, 68, 75, 82, 89,
      92, 99, 106, 113, 122, 129, 136, 143, 152, 159, 166, 173, 180,
      183, 190, 197, 204, 213, 220, 227, 234, 243, 250, 257, 264, 271,
      274, 281, 288, 295, 304, 311, 318, 325, 334, 341, 348, 355, 362
    ];

    let i = 0;
    for (let s = 0; s < 4; s++) {
      for (let w = 1; w <= 13; w++) {
        const long = (w <= 4 || w === 8 || w === 12);
        const len = long ? 9 : 7;

        for (let d = 0; d < len; d++) {
          const doy = starts[i] + d;
          if (doy <= 364) {
            this.heptads[doy] = { suit: this.suitCodes[s], week: w };
          }
        }
        i++;
      }
    }
  },

  daysFromGregorian(d) {
    return Math.floor((d.getTime() - this.epochUTC) / 86400000);
  },

  gpcFromDays(days) {
    const mod = (a, b) => ((a % b) + b) % b;

    const leapWeeks = (r) => {
      let l = 0;
      if (mod(r, 7) >= 6) l += 7;
      if (mod(r, 49) >= 48) l += 7;
      if (mod(r + 29, 70) === 0) l += 7;
      return l;
    };

    let y = this.epochYear;

    if (days >= 0) {
      while (true) {
        const r = y - this.epochYear;
        const yearLen = 364 + leapWeeks(r);
        if (days < yearLen) break;
        days -= yearLen;
        y++;
      }
    } else {
      while (days < 0) {
        y--;
        const r = y - this.epochYear;
        const yearLen = 364 + leapWeeks(r);
        days += yearLen;
      }
    }

    return { year: y, doy: days + 1 };
  }
};

// ===============================
// STATE
// ===============================

let mode = "DOY";
let heptad = false;
let connected = false;
let provider = null;

let emails = [];
const API_URL = "http://localhost:3000";

// ===============================
// FORMATTER
// ===============================

function formatGPC(doy, year) {
  const emoji = GPC.weekEmojis[(doy - 1) % 7];

  let core = "";

  if (mode === "DOY") {
    core = heptad
      ? String(doy).padStart(3, "0")
      : `${year}.${String(doy).padStart(3, "0")}`;
  }

  if (mode === "DOS") {
    const q = Math.floor((doy - 1) / 91) + 1;
    const d = (doy - 1) % 91 + 1;
    core = heptad
      ? `Q${q}-${String(d).padStart(2, "0")}`
      : `${year}.Q${q}-${String(d).padStart(2, "0")}`;
  }

  if (mode === "DOM") {
    const m = [30, 30, 31, 30, 30, 31, 30, 30, 31, 30, 30, 31];
    let r = doy, i = 0;

    while (r > m[i]) r -= m[i++];

    core = heptad
      ? `${String(i + 1).padStart(2, "0")}.${String(r).padStart(2, "0")}`
      : `${year}.${String(i + 1).padStart(2, "0")}.${String(r).padStart(2, "0")}`;
  }

  let h = "";
  if (heptad) {
    const o = GPC.heptads[doy];
    if (o) {
      h = ` ${String.fromCodePoint(o.suit)} ${o.week}`;
    }
  }

  return `${emoji} ${core}${h}`;
}

// ===============================
// EMAIL API (REAL BACKEND)
// ===============================

async function loadEmails() {
  try {
    const res = await fetch(`${API_URL}/emails`);
    emails = await res.json();
  } catch (err) {
    console.error("Email fetch failed:", err);
    emails = [];
  }
}

// ===============================
// CONNECT FLOW
// ===============================

async function connect(p) {
  provider = p;
  connected = true;

  document.getElementById("connect-screen").style.display = "none";
  document.getElementById("main-app").style.display = "block";

  await loadEmails();

  renderInbox();
  updateToday();

  // auto refresh inbox
  setInterval(async () => {
    if (connected) {
      await loadEmails();
      renderInbox();
    }
  }, 30000);
}

// ===============================
// RENDER INBOX
// ===============================

function renderInbox() {
  const inbox = document.getElementById("inbox");
  inbox.innerHTML = "";

  emails.forEach(e => {
    const days = GPC.daysFromGregorian(new Date(e.date));
    const g = GPC.gpcFromDays(days);
    const gpc = formatGPC(g.doy, g.year);

    const div = document.createElement("div");
    div.className = "email";

    div.innerHTML = `
      <div class="subject">${e.subject}</div>
      <div class="meta">${gpc} — ${e.from}</div>
    `;

    inbox.appendChild(div);
  });
}

// ===============================
// CONTROLS
// ===============================

document.querySelectorAll("[data-mode]").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll("[data-mode]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    mode = btn.dataset.mode;

    if (connected) {
      renderInbox();
      updateToday();
    }
  };
});

document.getElementById("heptad-btn").onclick = () => {
  heptad = !heptad;
  document.getElementById("heptad-btn").classList.toggle("active", heptad);

  if (connected) {
    renderInbox();
    updateToday();
  }
};

// ===============================
// TODAY DISPLAY
// ===============================

function updateToday() {
  const days = GPC.daysFromGregorian(new Date());
  const g = GPC.gpcFromDays(days);

  document.getElementById("gpc-display").textContent =
    formatGPC(g.doy, g.year);
}

// ===============================
// INIT
// ===============================

GPC.initHeptads();

// Start hidden
document.getElementById("main-app").style.display = "none";

// Initial clock
updateToday();
